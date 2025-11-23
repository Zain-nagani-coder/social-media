// ====== DOM REFERENCES ======
var homePage = document.getElementById("home-page");
var dashboardPage = document.getElementById("dashboard-page");
var homeLink = document.getElementById("home-link");
var dashboardLink = document.getElementById("dashboard-link");
var authBtn = document.querySelector(".auth-btn");
var authModal = document.getElementById("auth-modal");
var closeModal = authModal.querySelector(".close");
var loginTab = document.getElementById("login-tab");
var signupTab = document.getElementById("signup-tab");
var loginForm = document.getElementById("login-form");
var signupForm = document.getElementById("signup-form");
var loginFormContent = document.getElementById("login-form-content");
var signupFormContent = document.getElementById("signup-form-content");

var postsContainer = document.getElementById("posts-container");
var userPostsContainer = document.getElementById("user-posts-container");

// Create Post Modal
var createPostBtn = document.getElementById("create-post-btn");
var createPostModal = document.getElementById("create-post-modal");
var closeCreatePost = document.getElementById("close-create-post");
var createPostForm = document.getElementById("create-post-form");

// Form inputs
var postTitleInput = document.getElementById("create-post-title");
var postDescriptionInput = document.getElementById("create-post-description");
var postImageInput = document.getElementById("create-post-image");

// Hidden input for editing
var postIdInput = document.createElement("input");
postIdInput.type = "hidden";
createPostForm.appendChild(postIdInput);

// Cancel edit button
var cancelEditBtn = document.createElement("button");
cancelEditBtn.type = "button";
cancelEditBtn.textContent = "Cancel Edit";
cancelEditBtn.style.display = "none";
cancelEditBtn.style.marginLeft = "0.5rem";
createPostForm.appendChild(cancelEditBtn);

var currentUser = null;

// Search & Filter
var searchInput = document.getElementById("search-input");
var filterSelect = document.getElementById("filter-select");

// ====== INITIALIZE APP ======
function initApp(){
  var storedUser = localStorage.getItem("currentUser");
  if(storedUser){
    currentUser = JSON.parse(storedUser);
    updateAuthUI();
  }
  loadAllPosts();
  setupEventListeners();
}

function setupEventListeners(){
  homeLink.addEventListener("click", showHomePage);
  dashboardLink.addEventListener("click", showDashboardPage);
  authBtn.addEventListener("click", toggleAuthModal);
  closeModal.addEventListener("click", closeAuthModal);
  window.addEventListener("click", function(e){
    if(e.target === authModal) closeAuthModal();
    if(e.target === createPostModal) createPostModal.classList.remove("active");
  });

  loginTab.addEventListener("click", function(){
    setActiveTab(loginTab, signupTab);
    setActiveForm(loginForm, signupForm);
  });
  signupTab.addEventListener("click", function(){
    setActiveTab(signupTab, loginTab);
    setActiveForm(signupForm, loginForm);
  });

  loginFormContent.addEventListener("submit", handleLogin);
  signupFormContent.addEventListener("submit", handleSignup);

  createPostForm.addEventListener("submit", handlePostSubmit);
  cancelEditBtn.addEventListener("click", cancelEdit);

  createPostBtn.addEventListener("click", function(){
    if(!currentUser){
      openAuthModal();
      return;
    }
    createPostModal.classList.add("active");
  });

  searchInput.addEventListener("input", loadAllPosts);
  filterSelect.addEventListener("change", loadAllPosts);
}

// ====== PAGE SWITCHING ======
function showHomePage(){
  homePage.classList.add("active");
  dashboardPage.classList.remove("active");
}

function showDashboardPage(){
  if(!currentUser){ openAuthModal(); return; }
  homePage.classList.remove("active");
  dashboardPage.classList.add("active");
  loadUserPosts();
}

// ====== AUTH ======
function openAuthModal(){ authModal.classList.add("active"); }
function closeAuthModal(){ authModal.classList.remove("active"); }
function toggleAuthModal(){ if(currentUser){ handleLogout(); } else openAuthModal(); }
function setActiveTab(active, inactive){ active.classList.add("active"); inactive.classList.remove("active"); }
function setActiveForm(active, inactive){ active.classList.add("active"); inactive.classList.remove("active"); }

function updateAuthUI(){
  if(currentUser){
    authBtn.textContent = "Logout (" + currentUser.username + ")";
    dashboardLink.style.display = "inline-block";
  } else {
    authBtn.textContent = "Login";
    dashboardLink.style.display = "none";
  }
}

function handleLogin(e){
  e.preventDefault();
  var username = document.getElementById("login-username").value;
  var password = document.getElementById("login-password").value;
  var users = JSON.parse(localStorage.getItem("users")) || [];
  var user = users.find(u => u.username===username && u.password===password);
  if(user){
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    updateAuthUI();
    closeAuthModal();
    loginFormContent.reset();
    showDashboardPage();
  } else alert("Invalid username or password");
}

function handleSignup(e){
  e.preventDefault();
  var username = document.getElementById("signup-username").value;
  var password = document.getElementById("signup-password").value;
  var users = JSON.parse(localStorage.getItem("users")) || [];
  if(users.find(u=>u.username===username)){ alert("Username exists"); return; }
  var newUser = { id: Date.now().toString(), username, password };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  currentUser = newUser;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  updateAuthUI();
  closeAuthModal();
  signupFormContent.reset();
  showDashboardPage();
}

function handleLogout(){
  currentUser = null;
  localStorage.removeItem("currentUser");
  updateAuthUI();
  showHomePage();
}

// ====== POSTS ======
function handlePostSubmit(e){
  e.preventDefault();
  if(!currentUser){ openAuthModal(); return; }
  var title = postTitleInput.value.trim();
  var desc = postDescriptionInput.value.trim();
  var img = postImageInput.value.trim();
  if(!title || !desc || !img){ alert("Fill all fields"); return; }
  var posts = JSON.parse(localStorage.getItem("posts")) || [];
  if(postIdInput.value){ // edit
    var post = posts.find(p=>p.id===postIdInput.value && p.authorId===currentUser.id);
    if(post){
      post.title = title;
      post.description = desc;
      post.imageUrl = img;
    }
  } else { // new post
    posts.push({
      id: Date.now().toString(),
      title, description: desc, imageUrl: img,
      authorId: currentUser.id, authorUsername: currentUser.username,
      createdAt: new Date().toISOString(), likes: 0, likedBy: [], comments: []
    });
  }
  localStorage.setItem("posts", JSON.stringify(posts));
  createPostForm.reset();
  postIdInput.value = "";
  cancelEditBtn.style.display = "none";
  createPostModal.classList.remove("active");
  loadAllPosts();
  loadUserPosts();
}

function editPost(postId){
  if(!currentUser) return;
  var posts = JSON.parse(localStorage.getItem("posts")) || [];
  var post = posts.find(p=>p.id===postId && p.authorId===currentUser.id);
  if(post){
    postIdInput.value = post.id;
    postTitleInput.value = post.title;
    postDescriptionInput.value = post.description;
    postImageInput.value = post.imageUrl;
    createPostModal.classList.add("active");
    cancelEditBtn.style.display = "inline-block";
  }
}

function cancelEdit(){
  createPostForm.reset();
  postIdInput.value = "";
  cancelEditBtn.style.display = "none";
}

function deletePost(postId){
  if(!currentUser) return;
  if(!confirm("Delete this post?")) return;
  var posts = JSON.parse(localStorage.getItem("posts")) || [];
  posts = posts.filter(p=>!(p.id===postId && p.authorId===currentUser.id));
  localStorage.setItem("posts", JSON.stringify(posts));
  loadAllPosts();
  loadUserPosts();
}

function loadAllPosts(){
  var posts = JSON.parse(localStorage.getItem("posts")) || [];
  var search = searchInput.value.trim().toLowerCase();
  if(search) posts = posts.filter(p=>p.title.toLowerCase().includes(search));
  var filter = filterSelect.value;
  if(filter==="newest") posts.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  else if(filter==="oldest") posts.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  else if(filter==="mostLiked") posts.sort((a,b)=>(b.likes||0)-(a.likes||0));
  postsContainer.innerHTML = "";
  if(posts.length===0){ postsContainer.innerHTML = "<p>No posts found.</p>"; return; }
  posts.forEach(p=>postsContainer.appendChild(createPostElement(p,false)));
}

function loadUserPosts(){
  if(!currentUser){ userPostsContainer.innerHTML="<p>Login to see posts.</p>"; return; }
  var posts = JSON.parse(localStorage.getItem("posts")) || [];
  posts = posts.filter(p=>p.authorId===currentUser.id);
  posts.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  userPostsContainer.innerHTML="";
  if(posts.length===0){ userPostsContainer.innerHTML="<p>You have no posts.</p>"; return; }
  posts.forEach(p=>userPostsContainer.appendChild(createPostElement(p,true)));
}

// ===== CREATE POST ELEMENT =====
function createPostElement(post, isEditable){
  var div = document.createElement("div"); div.className="post-card";
  var img = document.createElement("img"); img.src=post.imageUrl; img.className="post-image"; div.appendChild(img);
  var content = document.createElement("div"); content.className="post-content";
  var title = document.createElement("h3"); title.className="post-title"; title.textContent=post.title;
  var desc = document.createElement("p"); desc.className="post-description"; desc.textContent=post.description;
  var author = document.createElement("div"); author.className="post-author"; author.textContent="By "+post.authorUsername;
  content.append(title, desc, author);

  // Like button
  var actions = document.createElement("div"); actions.className="post-actions";
  var likeBtn = document.createElement("button"); likeBtn.textContent=`❤ ${post.likes||0}`; likeBtn.className="btn-like";
  likeBtn.onclick=function(){
    if(!currentUser){ openAuthModal(); return; }
    toggleLike(post.id, likeBtn);
  }
  actions.appendChild(likeBtn);

  // Comment button + section
  var commentBtn = document.createElement("button"); commentBtn.textContent="💬"; commentBtn.className="btn-comment";
  var commentSection = document.createElement("div"); commentSection.className="comment-section"; commentSection.style.display="none";
  commentBtn.onclick=function(){ 
    commentSection.style.display = commentSection.style.display==="none"?"block":"none";
    renderComments(post.id, commentSection);
  }
  actions.appendChild(commentBtn);
  content.appendChild(actions);
  content.appendChild(commentSection);

  // Edit/Delete
  if(isEditable){
    var editDel = document.createElement("div"); editDel.className="post-actions";
    var editBtn = document.createElement("button"); editBtn.textContent="Edit"; editBtn.className="btn btn-edit"; editBtn.onclick=function(){editPost(post.id);}
    var delBtn = document.createElement("button"); delBtn.textContent="Delete"; delBtn.className="btn btn-delete"; delBtn.onclick=function(){deletePost(post.id);}
    editDel.append(editBtn, delBtn);
    content.appendChild(editDel);
  }

  div.appendChild(content);
  return div;
}

// ===== LIKE =====
function toggleLike(postId, likeBtn){
  var posts = JSON.parse(localStorage.getItem("posts")) || [];
  var post = posts.find(p=>p.id===postId);
  if(!post.likedBy) post.likedBy=[];
  var idx = post.likedBy.indexOf(currentUser.id);
  if(idx===-1){ post.likedBy.push(currentUser.id); post.likes=(post.likes||0)+1; }
  else { post.likedBy.splice(idx,1); post.likes=Math.max(0,(post.likes||0)-1); }
  localStorage.setItem("posts", JSON.stringify(posts));
  likeBtn.textContent=`❤ ${post.likes}`;
}

// ===== COMMENTS =====
function renderComments(postId, section){
  var posts = JSON.parse(localStorage.getItem("posts")) || [];
  var post = posts.find(p=>p.id===postId); if(!post.comments) post.comments=[];
  section.innerHTML="";

  // input
  var inputDiv = document.createElement("div");
  var input = document.createElement("input"); input.type="text"; input.placeholder="Write a comment..."; input.style.width="80%"; input.style.padding="0.3rem";
  var submit = document.createElement("button"); submit.textContent="Post"; submit.onclick=function(){
    if(!currentUser) { openAuthModal(); return; }
    if(input.value.trim()==="") return;
    post.comments.push({ username:currentUser.username, text:input.value, time:new Date().toLocaleString() });
    localStorage.setItem("posts", JSON.stringify(posts));
    renderComments(postId, section);
  }
  inputDiv.append(input, submit); section.appendChild(inputDiv);

  // existing comments
  post.comments.forEach((c, idx)=>{
    var cDiv = document.createElement("div"); cDiv.style.borderTop="1px solid #ddd"; cDiv.style.padding="0.2rem 0";
    cDiv.innerHTML=`<strong>${c.username}</strong> <em style="font-size:0.8rem;color:#666;">${c.time}</em><br>${c.text}`;
    if(currentUser && currentUser.username===c.username){
      var del = document.createElement("button"); del.textContent="Delete"; del.style.marginLeft="0.5rem"; del.style.fontSize="0.7rem";
      del.onclick=function(){ post.comments.splice(idx,1); localStorage.setItem("posts", JSON.stringify(posts)); renderComments(postId, section); }
      cDiv.appendChild(del);
    }
    section.appendChild(cDiv);
  });
}

document.addEventListener("DOMContentLoaded", initApp);




