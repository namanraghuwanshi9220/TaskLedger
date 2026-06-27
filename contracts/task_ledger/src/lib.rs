#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Task {
    pub id: u32,
    pub title: String,
    pub description: String,
    pub owner: Address,
    pub deadline: u64,
    pub is_completed: bool,
}

#[contracttype]
pub enum DataKey {
    Task(u32),
    TaskCount,
    TaskList,
}

#[contract]
pub struct TaskLedgerContract;

#[contractimpl]
impl TaskLedgerContract {
    /// Creates a new task in the ledger and returns the assigned task ID
    pub fn create_task(
        env: Env,
        title: String,
        description: String,
        deadline: u64,
        owner: Address,
    ) -> u32 {
        owner.require_auth();

        // Increment task ID counter
        let mut count: u32 = env.storage().instance().get(&DataKey::TaskCount).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&DataKey::TaskCount, &count);

        // Create the Task struct
        let task = Task {
            id: count,
            title: title.clone(),
            description,
            owner: owner.clone(),
            deadline,
            is_completed: false,
        };

        // Save task details
        env.storage().persistent().set(&DataKey::Task(count), &task);

        // Save task ID to list of tasks
        let mut task_ids: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::TaskList)
            .unwrap_or_else(|| Vec::new(&env));
        task_ids.push_back(count);
        env.storage().persistent().set(&DataKey::TaskList, &task_ids);

        // Emit creation event
        env.events().publish(
            (Symbol::new(&env, "task_created"), count),
            (title, owner),
        );

        count
    }

    /// Completes an existing task
    pub fn complete_task(env: Env, id: u32, caller: Address) {
        caller.require_auth();

        let key = DataKey::Task(id);
        let mut task: Task = env
            .storage()
            .persistent()
            .get(&key)
            .expect("Task does not exist");

        // Verify that only the task owner can complete the task
        assert_eq!(task.owner, caller, "Only the task owner can mark it as complete");
        assert!(!task.is_completed, "Task is already completed");

        task.is_completed = true;
        env.storage().persistent().set(&key, &task);

        // Emit completion event
        env.events().publish(
            (Symbol::new(&env, "task_completed"), id),
            task.owner,
        );
    }

    /// Transfers ownership of a task to a new Stellar address
    pub fn transfer_ownership(env: Env, id: u32, new_owner: Address, caller: Address) {
        caller.require_auth();

        let key = DataKey::Task(id);
        let mut task: Task = env
            .storage()
            .persistent()
            .get(&key)
            .expect("Task does not exist");

        // Verify caller is current owner
        assert_eq!(task.owner, caller, "Only the current owner can transfer task ownership");
        assert_ne!(caller, new_owner, "Cannot transfer ownership to yourself");

        let old_owner = task.owner.clone();
        task.owner = new_owner.clone();
        env.storage().persistent().set(&key, &task);

        // Emit ownership transfer event
        env.events().publish(
            (Symbol::new(&env, "task_transferred"), id),
            (old_owner, new_owner),
        );
    }

    /// Retrieves details of a specific task
    pub fn get_task(env: Env, id: u32) -> Option<Task> {
        env.storage().persistent().get(&DataKey::Task(id))
    }

    /// Lists all tasks currently registered in the contract ledger
    pub fn list_tasks(env: Env) -> Vec<Task> {
        let task_ids: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::TaskList)
            .unwrap_or_else(|| Vec::new(&env));

        let mut tasks = Vec::new(&env);
        for id in task_ids.iter() {
            if let Some(task) = env.storage().persistent().get::<DataKey, Task>(&DataKey::Task(id)) {
                tasks.push_back(task);
            }
        }
        tasks
    }
}
