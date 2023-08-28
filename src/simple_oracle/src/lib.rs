use ic_cdk::{update, query, init};
use candid::{candid_method, Principal};
use std::cell::RefCell;
use std::collections::HashMap;

pub type Key = Vec<u8>;
pub type CipherValue = String;

thread_local! {
    static STORE: RefCell<HashMap<Key, CipherValue>> = RefCell::new(HashMap::default());
    static OWNER: RefCell<Principal> = RefCell::new(Principal::anonymous());
}

#[update]
#[candid_method(update)]
pub fn set_val(key: Key, val: CipherValue) {
    // If you restrict the caller to the owner, you can write the assertion like this:
    // assert_eq!(ic_cdk::caller(), owner());
    STORE.with(|s| {
        s.borrow_mut().insert(key, val);
    });
}

#[query]
#[candid_method(query)]
pub fn get_val(key: Key) -> Option<CipherValue> {
    STORE.with(|s| {
        let store = s.borrow();
        store.get(&key).cloned()
    })
}

#[update]
#[candid_method(update)]
pub fn get_val_unwrap(key: Key) -> CipherValue {
    get_val(key).unwrap_or_default()
}

#[init]
fn init() {
    let caller = ic_cdk::caller();
    ic_cdk::println!("owner: {}", caller);
    OWNER.with(|o| {
        *o.borrow_mut() = caller;
    });
}

pub fn owner() -> Principal {
    OWNER.with(|o| {
        o.borrow().clone()
    })
}