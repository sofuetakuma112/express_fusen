"use strict";

{
  window.onload = setPostsList; // 画面ロード時に実行
  checkAuth();

  const loggedInUserName = document.getElementById("loggedInUserName");
  if (getUserObj()) {
    loggedInUserName.innerText = "こんにちは " + getUserObj().name + " さん";
  }

  const listArea = document.getElementById("list"); // リスト表示部

  const homeButton = document.getElementById("homeButton");
  const seeMyPosts = document.getElementById("seeMyPosts");
  const addButton = document.getElementById("addButton");
  const addModal = document.getElementById("addModal");
  const body = document.getElementById("body");
  const dropDownAddPost = document.getElementById("dropDownAddPost")
  dropDownAddPost.addEventListener("click", function(e) {
    e.preventDefault();
    addModal.click();
  });

  addButton.addEventListener("click", savePost);
  if (!getUserObj()) {
    addModal.removeAttribute("data-toggle");
    addModal.classList.add("disabled");
    addModal.style.cursor = "auto";
  }
  addModal.addEventListener("click", function() {
    const titleDOM = document.getElementById("title");
    const sntDOM = document.getElementById("snt");
    titleDOM.value = "";
    sntDOM.value = "";
    if (!getUserObj()) {
      if (document.getElementById("addModalAlert").style.display === "block") {
        return false;
      }
      document.getElementById("addModalAlert").style.display = "block";
    }
  });

  seeMyPosts.addEventListener("click", function() {
    setUserPostsList();
  });

  homeButton.addEventListener("click", function() {
    setPostsList();
  });

  // ユーザの保存
  function savePost() {
    // 入力値をJSONにして /savePostに送信 -> 送信後addToList呼び出し
    // 名前をテキストボックスから取得（要素.value）
    const titleDOM = document.getElementById("title");
    const title = titleDOM.value;

    const sntDOM = document.getElementById("snt");
    const snt = sntDOM.value;

    const userId = getUserObj()._id;

    // 取得した情報をもとにオブジェクトを作る
    const content = { title, snt, userId };

    const url = "/savePost"; // 通信先
    const req = new XMLHttpRequest(); // 通信用オブジェクト

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        addToList(title, snt, req.response, userId); // req.responseにはDBに追加したレコードのidが入っている
      }
    };
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(content)); // オブジェクトを文字列化して送信
  }

  // 全ユーザの取得
  function setPostsList() {
    // ページロード時に実行
    const url = "/findPosts"; // 通信先
    const req = new XMLHttpRequest(); // 通信用オブジェクト

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        const posts = JSON.parse(req.response); // req.responseにJSONファイルが入っている
        while (listArea.firstChild) {
          listArea.removeChild(listArea.firstChild);
        }
        for (let i in posts) {
          const post = posts[i];
          addToList(post.title, post.snt, post._id); // DOM追加
        }
      }
    };
    req.open("GET", url, true);
    req.send();
  }

  function setUserPostsList() {
    // ページロード時に実行
    const url = "/findUserPosts"; // 通信先
    const req = new XMLHttpRequest(); // 通信用オブジェクト

    const userId = { id: getUserObj()._id };

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        const posts = JSON.parse(req.response); // req.responseにJSONファイルが入っている
        while (listArea.firstChild) {
          listArea.removeChild(listArea.firstChild);
        }
        for (let i in posts) {
          const post = posts[i];
          addToList(post.title, post.snt, post._id); // DOM追加
        }
        console.log("DOM Changed!");
      }
    };
    req.open("POST", url, true);
    req.send(JSON.stringify(userId));
  }

  // server.jsで送信されたIDを元にDB上から一致するIDをもつレコードを消去
  function deletePost(id) {
    const postId = { id: id };

    const url = "/deletePost"; // 通信先
    const req = new XMLHttpRequest(); // 通信用オブジェクト

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        const closeButton = document.getElementById("closeButton");
        const target = document.getElementById(id); // ID で要素を特定
        closeButton.click();
        target.parentNode.removeChild(target); // 親要素に自分を削除させる
      }
    };
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(postId)); // オブジェクトを文字列化して送信
  }

  function showDetail(id) {
    const postId = { id: id };

    const url = "/showDetail"; // 通信先
    const req = new XMLHttpRequest(); // 通信用オブジェクト

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        const post = JSON.parse(req.response)[0];
        addToPost(post.title, post.snt, post._id, post.userId);
      }
    };
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(postId)); // オブジェクトを文字列化して送信
  }

  function showEditModal(id) {
    const postId = { id: id };

    const url = "/showEditModal"; // 通信先
    const req = new XMLHttpRequest(); // 通信用オブジェクト

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        const post = JSON.parse(req.response)[0];
        const closeButton = document.getElementById("closeButton");
        addToPostEdit(post.title, post.snt, post._id);
        closeButton.click();
      }
    };
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(postId)); // オブジェクトを文字列化して送信
  }

  function updatePost(id) {
    // 入力値をJSONにして /savePostに送信 -> 送信後addToList呼び出し
    // 名前をテキストボックスから取得（要素.value）
    const titleDOM = document.getElementById("editTitle");
    const title = titleDOM.value;

    const sntDOM = document.getElementById("editSnt");
    const snt = sntDOM.value;

    // 取得した情報をもとにオブジェクトを作る
    const content = { title, snt, id };

    const url = "/updatePost"; // 通信先
    const req = new XMLHttpRequest(); // 通信用オブジェクト

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        // 変更が加えられたPostの一覧の見た目だけ変えれば良い
        const changedPost = document.getElementById(id);
        changedPost.firstElementChild.firstElementChild.innerHTML = h(
          substrTwenty(title)
        );
        changedPost.firstElementChild.lastElementChild.innerHTML = h(
          substrTwenty(snt)
        );
      }
    };
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(content)); // オブジェクトを文字列化して送信
  }

  function addFav(id) {
    const content = { postId: id, userId: getUserObj()._id };

    const url = "/addFav"; // 通信先
    const req = new XMLHttpRequest(); // 通信用オブジェクト

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        const addFavIcon = document.getElementById(id + "favIcon");
        addFavIcon.classList.add("buttonPushed");
      }
    };
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(content)); // オブジェクトを文字列化して送信
  }

  function removeFav(id) {
    const content = { postId: id, userId: getUserObj()._id };

    const url = "/removeFav"; // 通信先
    const req = new XMLHttpRequest(); // 通信用オブジェクト

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        //
      }
    };
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(content)); // オブジェクトを文字列化して送信
  }

  function checkAlreadyAddedFav(id) {
    const content = { postId: id, userId: getUserObj()._id };

    const url = "/checkAlreadyAddedFav"; // 通信先
    const req = new XMLHttpRequest(); // 通信用オブジェクト

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        if (JSON.parse(req.response)[0]) {
          const addFavIcon = document.getElementById(id + "favIcon");
          addFavIcon.classList.add("buttonPushed");
        }
      }
    };
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(content)); // オブジェクトを文字列化して送信
  }

  function autoLink(str) {
    // HTMLタグの無害化とURLをaタグで囲む、改行をbrタグにする
    var regexp_url = /((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))/g; // ']))/;
    var regexp_makeLink = function(all, url, h, href) {
      return '<a href="h' + href + '" target="_blank" rel="noopener noreferrer">' + url + "</a>";
    };

    return str
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(regexp_url, regexp_makeLink)
      .replace(/\r?\n/g, "<br>");
  }

  function h(str) {
    // HTMLの無害化
    return str
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function substrTwenty(snt) {
    // 20文字以下になるようにカット
    if (snt.length > 20) {
      return snt.substr(0, 20) + "…";
    } else {
      return snt;
    }
  }

  function getUserObj() {
    // ログインしていなければundefinedが返ってくる
    const cookies = document.cookie; //全てのcookieを取り出して
    const cookiesArray = cookies.split(";");

    for (const c of cookiesArray) {
      const cArray = c.split("="); //さらに=で分割して配列に
      if (cArray[0] == "user") {
        // 取り出したいkeyと合致したら
        const decodedStr = decodeURIComponent(cArray[1].substr(4));
        return JSON.parse(decodedStr);
      }
    }
  }

  function checkAuth() {
    if (getUserObj()) {
      const loginLink = document.getElementById("login-link");
      const registerLink = document.getElementById("register-link");
      loginLink.style.display = "none";
      registerLink.style.display = "none";
    } else {
      const logoutLink = document.getElementById("logout-link");
      const dropdownMenu = document.getElementById('dropdown-menu')
      logoutLink.style.display = "none";
      dropdownMenu.style.display = 'none'
    }
  }

  // 入力された値を元にHTMLにDOM追加
  function addToList(title, snt, id, userId) {
    const cardDivDOM = document.createElement("div");
    cardDivDOM.id = id; // ID を付与する
    cardDivDOM.classList.add("card", "col-6", "col-md-4", "userId");
    cardDivDOM.style.width = "18rem";
    cardDivDOM.style.cursor = "pointer";
    cardDivDOM.addEventListener("mouseenter", function() {
      this.style.opacity = "0.6";
    });
    cardDivDOM.addEventListener("mouseleave", function() {
      this.style.opacity = "1";
    });

    cardDivDOM.addEventListener("click", function() {
      showDetail(id);
    });

    const cardBodyDivDOM = document.createElement("div");
    cardBodyDivDOM.classList.add("card-body");

    const titleDOM = document.createElement("h5");
    titleDOM.id = "postListTitle"
    titleDOM.innerHTML = h(substrTwenty(title));
    titleDOM.classList.add("card-title");

    const sntDOM = document.createElement("p");
    sntDOM.innerHTML = h(substrTwenty(snt));
    sntDOM.classList.add("card-text");

    cardBodyDivDOM.appendChild(titleDOM);
    cardBodyDivDOM.appendChild(sntDOM);
    // cardBodyDivDOM.appendChild(linkDOM);
    cardDivDOM.appendChild(cardBodyDivDOM);
    listArea.appendChild(cardDivDOM);
  }

  function addToPost(title, snt, id, userId) {
    if (document.getElementById("showDetailModal")) {
      const target = document.getElementById("showDetailModal");
      target.parentNode.removeChild(target);
    }

    const modalDOM = document.createElement("div");
    modalDOM.id = "showDetailModal";
    modalDOM.classList.add("modal", "fade");
    modalDOM.setAttribute("tabindex", "-1");
    modalDOM.setAttribute("role", "dialog");
    modalDOM.setAttribute("aria-labelledby", "showDetailModalLabel");
    modalDOM.setAttribute("aria-hidden", "true");

    const modalDialogDOM = document.createElement("div");
    modalDialogDOM.classList.add("modal-dialog");
    modalDialogDOM.setAttribute("role", "document");

    const modalContentDOM = document.createElement("div");
    modalContentDOM.classList.add("modal-content");

    const modalHeaderDOM = document.createElement("div");
    modalHeaderDOM.classList.add("modal-header");

    const modalTitleDOM = document.createElement("h3");
    modalTitleDOM.classList.add("modal-title");
    modalTitleDOM.id = 'postDetailTitle'
    modalTitleDOM.innerText = title;

    const modalBodyDOM = document.createElement("div");
    modalBodyDOM.classList.add("modal-body");

    const modalBodySntDOM = document.createElement("p");
    modalBodySntDOM.innerHTML = autoLink(snt);

    const modalFooterDOM = document.createElement("div");
    modalFooterDOM.classList.add("modal-footer");

    if (getUserObj()) {
      const favButtonDOM = document.createElement("button");
      const favIcon = document.createElement("i");
      const textNode = document.createTextNode(" nice");
      favIcon.id = id + "favIcon";
      favIcon.classList.add("material-icons");

      checkAlreadyAddedFav(id);

      favIcon.innerText = "favorite";
      favButtonDOM.classList.add("btn", "btn-primary", "btn-round", "mr-3");
      favButtonDOM.addEventListener("click", function(e) {
        e.stopPropagation();
        if (favIcon.classList.contains("buttonPushed")) {
          removeFav(id);
          favIcon.classList.remove("buttonPushed");
        } else {
          addFav(id);
        }
      });
      favButtonDOM.appendChild(favIcon);
      favButtonDOM.appendChild(textNode);
      modalFooterDOM.appendChild(favButtonDOM);

      if (getUserObj()._id === userId) {
        const editButtonDOM = document.createElement("button");
        editButtonDOM.innerText = "編集";
        editButtonDOM.classList.add("btn", "btn-success", "mr-3");
        editButtonDOM.addEventListener("click", function(e) {
          e.stopPropagation();
          showEditModal(id);
        });
        modalFooterDOM.appendChild(editButtonDOM);
      }

      if (getUserObj()._id === userId) {
        const delButtonDOM = document.createElement("button");
        delButtonDOM.innerText = "削除";
        delButtonDOM.classList.add("btn", "btn-danger", "mr-3");
        delButtonDOM.addEventListener("click", function(e) {
          e.stopPropagation();
          if (window.confirm("削除しますか？")) {
            deletePost(id);
          }
        });
        modalFooterDOM.appendChild(delButtonDOM);
      }
    }

    const closeButtonDOM = document.createElement("button");
    closeButtonDOM.id = "closeButton";
    closeButtonDOM.setAttribute("type", "button");
    closeButtonDOM.setAttribute("data-dismiss", "modal");
    closeButtonDOM.classList.add("btn", "btn-secondary");
    closeButtonDOM.innerText = "Close";

    modalHeaderDOM.appendChild(modalTitleDOM);
    modalBodyDOM.appendChild(modalBodySntDOM);
    modalFooterDOM.appendChild(closeButtonDOM);
    modalContentDOM.appendChild(modalHeaderDOM);
    modalContentDOM.appendChild(modalBodyDOM);
    modalContentDOM.appendChild(modalFooterDOM);
    modalDialogDOM.appendChild(modalContentDOM);
    modalDOM.appendChild(modalDialogDOM);
    body.appendChild(modalDOM);

    const hideButton = document.getElementById("hideButton");
    hideButton.click();
  }

  function addToPostEdit(title, snt, id) {
    if (document.getElementById("showEditDetailModal")) {
      const target = document.getElementById("showEditDetailModal");
      target.parentNode.removeChild(target);
    }

    const modalDOM = document.createElement("div");
    modalDOM.id = "showEditDetailModal";
    modalDOM.classList.add("modal", "fade");
    modalDOM.setAttribute("tabindex", "-1");
    modalDOM.setAttribute("role", "dialog");
    modalDOM.setAttribute("aria-labelledby", "showEditDetailModalLabel");
    modalDOM.setAttribute("aria-hidden", "true");

    const modalDialogDOM = document.createElement("div");
    modalDialogDOM.classList.add("modal-dialog");
    modalDialogDOM.setAttribute("role", "document");

    const modalContentDOM = document.createElement("div");
    modalContentDOM.classList.add("modal-content");

    const modalHeaderDOM = document.createElement("div");
    modalHeaderDOM.classList.add("modal-header");

    const modalTitleDOM = document.createElement("h5");
    modalTitleDOM.classList.add("modal-title");
    modalTitleDOM.innerText = "Edit";

    const timesButtonDOM = document.createElement("button");
    timesButtonDOM.setAttribute("type", "button");
    timesButtonDOM.setAttribute("data-dismiss", "modal");
    timesButtonDOM.setAttribute("aria-label", "Close");
    timesButtonDOM.classList.add("close");

    const timesSpanDOM = document.createElement("span");
    timesSpanDOM.innerHTML = decodeURI("&times;");
    timesSpanDOM.setAttribute("aria-hidden", "true");

    timesButtonDOM.appendChild(timesSpanDOM);

    const modalBodyDOM = document.createElement("div");
    modalBodyDOM.classList.add("modal-body");

    const labelTitleDOM = document.createElement("label");
    labelTitleDOM.setAttribute("for", "editTitle");
    labelTitleDOM.innerText = "タイトル";

    const inputTitleDOM = document.createElement("input");
    inputTitleDOM.id = "editTitle";
    inputTitleDOM.setAttribute("name", "title");
    inputTitleDOM.setAttribute("type", "text");
    inputTitleDOM.classList.add("form-control");
    inputTitleDOM.value = title;

    const labelSntDOM = document.createElement("label");
    labelSntDOM.setAttribute("for", "editSnt");
    labelSntDOM.innerText = "内容";

    const textareaDOM = document.createElement("textarea");
    textareaDOM.classList.add("form-control");
    textareaDOM.id = "editSnt";
    textareaDOM.setAttribute("rows", "15");
    textareaDOM.value = snt;

    const modalFooterDOM = document.createElement("div");
    modalFooterDOM.classList.add("modal-footer");

    const closeButtonDOM = document.createElement("button");
    closeButtonDOM.setAttribute("type", "button");
    closeButtonDOM.setAttribute("data-dismiss", "modal");
    closeButtonDOM.classList.add("btn", "btn-secondary");
    closeButtonDOM.innerText = "Close";

    const inputSendDOM = document.createElement("input");
    inputSendDOM.setAttribute("type", "button");
    inputSendDOM.setAttribute("value", "Send");
    inputSendDOM.setAttribute("data-dismiss", "modal");
    inputSendDOM.classList.add("btn", "btn-primary");
    inputSendDOM.id = "editButton";
    inputSendDOM.addEventListener("click", function() {
      updatePost(id);
    });

    modalHeaderDOM.appendChild(modalTitleDOM);
    modalHeaderDOM.appendChild(timesButtonDOM);

    modalBodyDOM.appendChild(labelTitleDOM);
    modalBodyDOM.appendChild(inputTitleDOM);
    modalBodyDOM.appendChild(labelSntDOM);
    modalBodyDOM.appendChild(textareaDOM);

    modalFooterDOM.appendChild(closeButtonDOM);
    modalFooterDOM.appendChild(inputSendDOM);

    modalContentDOM.appendChild(modalHeaderDOM);
    modalContentDOM.appendChild(modalBodyDOM);
    modalContentDOM.appendChild(modalFooterDOM);
    modalDialogDOM.appendChild(modalContentDOM);
    modalDOM.appendChild(modalDialogDOM);
    body.appendChild(modalDOM);

    const editHideButton = document.getElementById("editHideButton");
    editHideButton.click();
  }
}
