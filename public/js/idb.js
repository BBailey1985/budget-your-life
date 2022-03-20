let db;

//establish connection to IndexedDB
const request = indexedDB.open('budget-your-life', 1);

request.onupgradeneeded = event => {
  const db = event.target.result;

  // create object store called "new_budget_item"
  db.createObjectStore('new_budget_item', { autoIncrement: true });
};

//when successful
request.onsuccess = event => {
  db = event.target.result;
  //check to see if app is online 
  if (navigator.onLine) {
    checkTransaction();
  }
};

//if error
request.onerror = event => console.log(event.target.errorCode);

//check transaction function
function checkTransaction() {
  const transaction = db.transaction(['new_budget_item'], 'readwrite');
  const budgetObjectStore = transaction.budgetObjectStore('new_budget_item');
  const getAll = budgetObjectStore.getAll();

  //once .getAll is successful
  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_budget_item'], 'readwrite');
          // access the new_budget_item object store
          const budgetObjectStore = transaction.objectStore('new_budget_item');
          // clear all items in your store
          budgetObjectStore.clear();
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}

//save record
function saveRecord(record) {
  const transaction = db.transaction(['new_budget_item'], 'readwrite');
  // access the new_budget_item object store
  const budgetObjectStore = transaction.objectStore('new_budget_item');
  //add record
  budgetObjectStore.add(record)
}

//event listener for app to come back online
window.addEventListener('online', checkTransaction);