import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


//---------------------เชื่อม Firebase-----------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyDwSsP5_WynoVKmc-_U7t2yn1-qt7VjI0I",
    authDomain: "ordering-siam-canteen.firebaseapp.com",
    databaseURL: "https://ordering-siam-canteen-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ordering-siam-canteen",
    storageBucket: "ordering-siam-canteen.appspot.com",
    messagingSenderId: "771381090783",
    appId: "1:771381090783:web:5a63fa91efbc367b184c6a",
    measurementId: "G-QMWF3V531S"
  };
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth();

  const addform = document.getElementById("addForm");

document.getElementById("addForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = e.target.Email.value;
    const password = e.target.Password.value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User registered:", user);
    } catch (error) {
        console.error("Error registering user:", error);
    }
});



// Populate the Type dropdown in the edit form
async function populateEditTypeDropdown(customerData) {
  const editTypeDropdown = document.querySelector('#editTypeDropdown');
  editTypeDropdown.innerHTML = '';

  const querySnapshot = await getDocs(collection(db, 'Category'));

  querySnapshot.forEach((doc) => {
    const category = doc.data();
    const option = document.createElement('option');
    option.value = category.Title;
    option.textContent = category.Title;
    editTypeDropdown.appendChild(option);

    if (customerData.RT_type?.Title === category.Title) {
      option.selected = true; // Set selected based on the original value
      console.log(customer);
    }
  });
}


  async function getTypeDocRef(typeTitle) {
    const typeCollectionRef = collection(db, "Category");
  
    // ค้นหาเอกสารที่มีฟิลด์ "Title" ตรงกับ typeTitle
    const querySnapshot = await getDocs(typeCollectionRef);
    let typeDocRef = null;
  
    querySnapshot.forEach((doc) => {
      const type = doc.data();
      if (type.Title === typeTitle) {
        typeDocRef = doc.ref;
      }
    });
  
    if (!typeDocRef) {
      console.log(`No such document with Title: ${typeTitle}`);
    }
  
    return typeDocRef;
  }
 // ฟังก์ชันอัปเดท
 async function updateCustomer(ID, updatedData) {
  try {
    const docRef = doc(db, "Restaurant", ID);

    // Convert RT_type to a DocumentReference
    const typeDocRef = await getTypeDocRef(updatedData.RT_type);
    updatedData.RT_type = typeDocRef;

    await updateDoc(docRef, { ...updatedData });
    console.log(`Document with ID: ${ID} updated successfully`);
  } catch (error) {
    console.error("Error updating document: ", error);
  }
}

// handle form submission
async function checkDocumentExists(id) {
  const docRef = doc(db, "Restaurant", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}
const editForm = document.querySelector('#editForm');
editForm.addEventListener('submit', async function(event) {
  event.preventDefault();

  const formData = new FormData(editForm);
  const updatedData = {
    ID: formData.get('ID'),
    RT_type: formData.get('Type'),
    RT_name: formData.get('Restaurant'),
    RT_nameuser: formData.get('Name'),
    RT_email: formData.get('Email'),
    RT_pass: formData.get('Password'),
    status: formData.get('Status'),
  };

  const customerId = formData.get('ID'); // ใช้ค่าจากฟอร์มเป็น ID
  const exists = await checkDocumentExists(customerId);
  if (exists) {
    await updateCustomer(customerId, updatedData);
  } else {
    console.log(`Document with ID ${customerId} does not exist`);
  }

  fetchCustomers();
});
//-----------------------------------------------------------------------------------------------------
//---------------------ดึงข้อมูลลูกค้าจาก Firestore---------------------------------------------------------
const tableBody = document.querySelector("tbody");

async function fetchCustomers() {
  tableBody.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "Restaurant"));

  querySnapshot.forEach(async (doc) => {
    const customer = doc.data();
    
    // Fetch the document that RT_type references to
    const rt_typeDoc = await getDoc(customer.RT_type);
    console.log(customer);
    if (rt_typeDoc.exists()) {
      const rt_typeData = rt_typeDoc.data();

      // Now you can access the Title field
      console.log(rt_typeData.Title);

      const row = document.createElement("tr");

      // Use rt_typeData.Title instead of customer.RT_type
      row.innerHTML = `
        <td>${customer.ID}</td>
        <td>${rt_typeData.Title}</td>
        <td>${customer.RT_name}</td>
        <td>${customer.RT_nameuser}</td>
        <td>${customer.RT_email}</td>
        <td>${customer.RT_pass}</td>
        <td>${customer.status}</td>
        <td>
        <button class="edit-button" data-id="${doc.id}">Edit</button>
        <button class="delete-button" data-id="${doc.id}">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);

    // Add event listener to the edit button
    const editButton = row.querySelector('.edit-button');
    editButton.addEventListener('click', function() {
      
      // Fill the form
      const editForm = document.querySelector('form#editForm');
      editForm.querySelector('input[name="ID"]').value = customer.ID;
      editForm.querySelector('select[name="Type"]').value = rt_typeData.ID;
      editForm.querySelector('input[name="Restaurant"]').value = customer.RT_name;
      editForm.querySelector('input[name="Name"]').value = customer.RT_nameuser;
      editForm.querySelector('input[name="Email"]').value = customer.RT_email;
      editForm.querySelector('input[name="Password"]').value = customer.RT_pass;
      editForm.querySelector('input[name="Status"]').value = customer.status;
      
      // Show the popup
      const updatePopup = document.querySelector('.popup.update');
      updatePopup.style.display = 'block';
      populateEditTypeDropdown(customer); // เรียกใช้ฟังก์ชันเพื่อเตรียม dropdown ในฟอร์มแก้ไข
      // Add event listener to the close button (X button) in the popup
      const closeBtn = updatePopup.querySelector('.close-btn');
      closeBtn.addEventListener('click', function() {
        updatePopup.style.display = 'none';
        
          });
    });
  } else {
    console.log('No such document!');
  }
});
}


fetchCustomers();

//----------------------เพิ่มข้อมูล-----------------------------------------------------
// เมื่อคลิก submit บนฟอร์ม
addform.addEventListener("submit", async function (event) {
  event.preventDefault(); // ป้องกันการรีเฟรชหน้าเว็บ

  const email = document.getElementById("RT_email").value;
  const password = document.getElementById("RT_pass").value;
  const restaurant = document.getElementById("RT_name").value;
  const name = document.getElementById("RT_nameuser").value;
  const type = document.getElementById("typeDropdown").value;
  const status = document.getElementById("status").value;

  try{
    const userCredential = await firebaseConfig.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    await firebase.firestore().collection("users").doc(user.uid).set({
      email: email,
      type: type,
      restaurant: restaurant,
      name: name,
      status: status
    });

  } catch (error) {
    console.error("Error creating new user: ",error);
  }


  // ดึงข้อมูลจากฟอร์ม
  const formData = new FormData(addform);
  const customerData = {
    RT_type: formData.get("Type"),
    RT_name: formData.get("Restaurant"),
    RT_nameuser: formData.get("Name"),
    RT_email: formData.get("Email"),
    RT_pass: formData.get("Password"),
    status: formData.get("Status"),
  };

  // เรียกใช้ฟังก์ชันเพิ่มข้อมูลลูกค้าใหม่
  await addCustomer(customerData); // เพิ่ม await ที่เรียกใช้งาน addCustomer() เพื่อรอให้การเพิ่มข้อมูลเสร็จสิ้นก่อนที่จะเรียกใช้งาน fetchCustomers()

  // ล้างฟอร์ม
  addform.reset();
});


// ฟังก์ชันสร้าง ID เฉพาะสำหรับเอกสารใหม่
async function generateCustomID(collectionName) {
  const collectionRef = collection(db, collectionName);
  const querySnapshot = await getDocs(collectionRef);

  let maxID = 0;
  querySnapshot.forEach((doc) => {
    const id = parseInt(doc.id.replace("R", ""));
    if (id > maxID) {
      maxID = id;
    }
  });

  const newID = maxID + 1;
  const formattedID = `R${newID.toString().padStart(4, "0")}`;

  return formattedID;
}
// ใช้ฟังก์ชัน generateCustomID เพื่อสร้าง ID ใหม่ที่ไม่ซ้ำกับที่มีอยู่ในฐานข้อมูล
const customID = await generateCustomID("Restaurant");

// เพิ่มเอกสารใหม่
async function addCustomer(customerData) {
  try {
    const customID = await generateCustomID("Restaurant"); // สร้าง ID เอกสารเฉพาะสำหรับคอลเลกชัน "Restaurant"
    customerData.ID = customID; // กำหนดค่า ID ให้กับข้อมูลลูกค้า

    // Convert RT_type to a DocumentReference
    const typeDocRef = await getTypeDocRef(customerData.RT_type);
    customerData.RT_type = typeDocRef;

    await setDoc(doc(db, "Restaurant", customID), customerData); // เปลี่ยนเป็น await setDoc() เพื่อให้มั่นใจว่าการเพิ่มข้อมูลเสร็จสิ้นก่อนที่จะเรียกใช้ fetchCustomers()
    console.log("Document written with ID: ", customID);
    fetchCustomers();
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}


//------------------------------------------------------------------------------------------
//---------------------------------ลบข้อมูลเมื่อคลิกที่ปุ่ม Delete-----------------------------------
tableBody.addEventListener("click", function (event) {
  if (event.target.classList.contains("delete-button")) {
    const customerId = event.target.dataset.id;
    deleteCustomer(customerId);
  }
});

// ฟังก์ชัน deleteCustomer
async function deleteCustomer(customerId) {
  try {
    const confirmation = confirm("Are you sure you want to delete this customer?");
    if (!confirmation) {
      return; // ถ้าผู้ใช้กด Cancel ให้ออกจากฟังก์ชัน
    }

    const docRef = doc(db, "Restaurant", customerId);
    await deleteDoc(docRef);
    console.log("Document with ID: ", customerId, " successfully deleted");
    fetchCustomers(); // เรียกใช้ฟังก์ชันเพื่อดึงข้อมูลลูกค้าใหม่
  } catch (error) {
    console.error("Error deleting document: ", error);
  }
}
async function populateTypeDropdown() {
  // Get a reference to the dropdown element
  const typeDropdown = document.querySelector('#typeDropdown');

  // Fetch categories from Firestore
  const querySnapshot = await getDocs(collection(db, 'Category'));

  // Iterate over each category and add it as a new option in the dropdown
  querySnapshot.forEach((doc) => {
    const category = doc.data();
    const option = document.createElement('option');
    option.value = category.Title; // Assume that 'Title' is a field in the category documents
    option.textContent = category.Title;
    typeDropdown.appendChild(option);
  });
}

// Call the function to populate the dropdown when the script loads
populateTypeDropdown();

//-----------------------------------------------------------------------------------------------------
//-------------------Show popup------------------------------------------------------------------------

document.querySelector("#addButton").addEventListener("click",function(){
  document.querySelector(".popup").classList.add("active");
});
document.querySelector(".popup .close-btn").addEventListener("click",function(){
  document.querySelector(".popup").classList.remove("active");
});
// add hovered class to selected list item
let list = document.querySelectorAll(".navigation li");

function activeLink() {
  list.forEach((item) => {
    item.classList.remove("hovered");
  });
  this.classList.add("hovered");
}

list.forEach((item) => item.addEventListener("mouseover", activeLink));

// Menu Toggle
let toggle = document.querySelector(".toggle");
let navigation = document.querySelector(".navigation");
let main = document.querySelector(".main");

toggle.onclick = function () {
  navigation.classList.toggle("active");
  main.classList.toggle("active");
};
