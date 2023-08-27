use ic_cdk::{update, query};
use candid::{candid_method};
use std::cell::RefCell;
use std::collections::HashMap;

pub type CipherValue = Vec<u8>;
pub type Key = Vec<u8>;

thread_local! {
    static STORE: RefCell<HashMap<Key, CipherValue>> = RefCell::new(HashMap::default());
}

#[update]
#[candid_method(update)]
pub fn set_val(key: Key, val: CipherValue) {
    STORE.with(|s| {
        s.borrow_mut().insert(key, val);
    });
}

#[query]
#[candid_method(query)]
pub fn get_val(key: Key) -> CipherValue {
    STORE.with(|s| {
        let store = s.borrow();
        store.get(&key).unwrap().clone()
    })
} 