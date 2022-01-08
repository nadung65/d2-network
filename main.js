// Cấu hình firebase
const firebaseConfig = {
  apiKey: "AIzaSyClJCr_QB9ZDir5fLDiBum42qVGZhnUgmo",
  authDomain: "d2-network.firebaseapp.com",
  databaseURL: "https://d2-network-default-rtdb.firebaseio.com",
  projectId: "d2-network",
  storageBucket: "d2-network.appspot.com",
  messagingSenderId: "439403588318",
  appId: "1:439403588318:web:0f0617f5375adeed3e304f",
};

const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();

let peer;
let peerList = [];
let localStream;
let authEmail;
let userEmail;
let remotePeerID;

// Lấy các tham số từ URL
const paramString = window.location.search.substring(1);
const param = paramString.split("&");

// Hàm bắt đầu cuộc gọi trên web
const startCallFromWeb = () => {
  peer = new Peer();

  peer.on("open", (id) => {
    if (!navigator.mediaDevices) {
      console.log("Not supported");
      return;
    }

    console.log("#" + id);

    db.collection("users")
      .doc(authEmail)
      .update({
        inCall: id,
      })
      .then(() => {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then(async (stream) => {
            localStream = stream;
            addLocalVideo(stream);

            startCall(remotePeerID);

            db.collection("users")
              .doc(userEmail)
              .onSnapshot((snapshot) => {
                if (snapshot.data().inCall === "end") {
                  peer.destroy();

                  db.collection("users")
                    .doc(userEmail)
                    .update({ inCall: firebase.firestore.FieldValue.delete() })
                    .then(() => alert("Cuộc gọi đã kết thúc!"));
                }
              });
          });
      });
  });
};

// Hàm lắng nghe cuộc gọi trên web
const listenFromWeb = () => {
  console.log("listen from web");

  peer = new Peer();

  peer.on("open", (id) => {
    if (!navigator.mediaDevices) {
      console.log("Not supported");
      return;
    }

    console.log("#" + id);

    db.collection("users")
      .doc(authEmail)
      .update({
        inCall: id,
      })
      .then(() => {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then(async (stream) => {
            localStream = stream;
            addLocalVideo(stream);

            listen();

            db.collection("users")
              .doc(userEmail)
              .onSnapshot((snapshot) => {
                if (snapshot.data().inCall === "end") {
                  peer.destroy();

                  db.collection("users")
                    .doc(userEmail)
                    .update({ inCall: firebase.firestore.FieldValue.delete() })
                    .then(() => alert("Cuộc gọi đã kết thúc!"));
                }
              });
          });
      });
  });
};

if (param.length > 0) {
  authEmail = param[0].substring(5);
  userEmail = param[1].substring(5);

  console.log("authEmail:", authEmail);
  console.log("userEmail:", userEmail);

  // Nếu nhận được remotePeerID thì bắt đầu cuộc gọi
  if (param.length === 3) {
    remotePeerID = param[2].substring(3);
    console.log("remotePeerID:", remotePeerID);

    startCallFromWeb();

    // Nếu không có remotePeerID thì lắng nghe
  } else {
    listenFromWeb();
  }
}

// Hàm lắng nghe cuộc gọi
const listen = () => {
  peer.on("call", (call) => {
    call.answer(localStream);
    call.on("stream", (remoteStream) => {
      if (!peerList.includes(call.peer)) {
        addRemoteVideo(remoteStream);
        peerList.push(call.peer);
      }
    });
  });

  return true;
};

// Hàm bắt đầu cuộc gọi
const startCall = (remotePeerID) => {
  let call = peer.call(remotePeerID, localStream);
  call &&
    call.on("stream", (remoteStream) => {
      if (!peerList.includes(call.peer)) {
        addRemoteVideo(remoteStream);
        peerList.push(call.peer);
        currentPeer = call.peerConnection;
      }
    });

  return true;
};

// Hàm kết thúc cuộc gọi
const endCall = () => {
  peer.destroy();

  db.collection("users")
    .doc(userEmail)
    .update({
      inCall: firebase.firestore.FieldValue.delete(),
    })
    .then(() => {
      // Cập nhật trạng thái của người kết thúc cuộc gọi
      db.collection("users").doc(authEmail).update({ inCall: "end" });
    })
    .then(() => alert("Cuộc gọi đã kết thúc!"));
};

// Hiển thị hình ảnh webcam của người dùng
const addLocalVideo = (stream) => {
  document.getElementById("localVideo").srcObject = stream;

  return true;
};

// Hiển thị hình ảnh webcam của đối phương
const addRemoteVideo = (stream) => {
  document.getElementById("remoteVideo").srcObject = stream;

  return true;
};

// Bật tắt video
const handleToggleVideo = () => {
  const videoIcon = document.querySelector(".btnVideo img").src;
  const boolean = videoIcon.includes("enable");
  document.querySelector(".btnVideo img").src = boolean
    ? "./assets/disable-video.png"
    : "./assets/enable-video.png";
  toggleVideo(!boolean);
};

const toggleVideo = (boolean) => {
  localStream.getVideoTracks()[0].enabled = boolean;

  return true;
};

//   Bật tắt âm thanh
const handleToggleAudio = () => {
  const audioIcon = document.querySelector(".btnAudio img").src;
  const boolean = audioIcon.includes("enable");
  document.querySelector(".btnAudio img").src = boolean
    ? "./assets/disable-audio.png"
    : "./assets/enable-audio.png";
  toggleAudio(!boolean);
};

const toggleAudio = (boolean) => {
  localStream.getAudioTracks()[0].enabled = boolean;

  return true;
};
