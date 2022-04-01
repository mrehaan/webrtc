
import './App.css';
import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io(
  '/webRTCPeers',
  {
    path: '/webrtc'
  }
)

function App() {

  const localVideoRef = useRef()
  const remoteVideoRef = useRef()
  const pc = useRef(new RTCPeerConnection(null))
  const textRef = useRef()
  const candidates = useRef([])

  const [offerVisible, setOfferVisible] = useState(true)
  const [answerVisible, setAnswerVisible] = useState(false)
  const [status, setStatus] = useState('make the call')

  


  useEffect(() => {


    socket.on('connection-success',success => {
      console.log(success)
    })

    socket.on('sdp', data => {
      console.log(data)
      pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp))
      textRef.current.value = JSON.stringify(data.sdp)

      if(data.sdp.type == 'offer') {
        setOfferVisible(false)
        setAnswerVisible(true)
        setStatus('Incoming Call....')
      }
      else {
        setStatus('Call Established Successfully')
      }
    })

    socket.on('candidate', candidate => {
      console.log(candidate)
      //candidates.current = [...candidates.current,candidate]
      pc.current.addIceCandidate(new RTCIceCandidate(candidate))
    })
    const constraints = {
      audio:false,
      video:true,

    }

    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream =>{
     //display the video

     localVideoRef.current.srcObject = stream

     stream.getTracks().forEach(track => {
       _pc.addTrack(track,stream)
     })


    })
    .catch(e => {
      console.log('get user mode error',e)
    })

    const _pc = new RTCPeerConnection(null)

    _pc.onicecandidate = (e) => {
      if(e.candidate)
        console.log(JSON.stringify(e.candidate))
        sendToPeer('candidate',e.candidate)
    }

    _pc.oniceconnectionstatechange = (e) => {
      console.log(e)
    }

    _pc.ontrack = (e) => {

      remoteVideoRef.current.srcObject = e.streams[0]

    }

    pc.current = _pc

  },[]

  )

  const sendToPeer = (eventType, payload) => {

    socket.emit(eventType,payload)
  }

  const processSDP = (sdp) => {
    console.log(JSON.stringify(sdp))
    pc.current.setLocalDescription(sdp)
   
    sendToPeer('sdp',{sdp})
  
  }

  const createOffer = () => {

    pc.current.createOffer({

      offerToReceiveAudio:1,
      offerToReceiveVideo: 1,

    }).then(sdp => {

    processSDP(sdp)
    setOfferVisible(false)
    setStatus('Caling...')

    }).catch(e => console.log(e))


  }

  const createAnswer = () => {

    pc.current.createAnswer({

      offerToReceiveAudio:1,
      offerToReceiveVideo: 1,

    }).then(sdp => {

      processSDP(sdp)
      setAnswerVisible(false)
      setStatus('Call Established Successfully!')

    }).catch(e => console.log(e))


  }

  const setRemoteDescription = () => {

    const sdp = JSON.parse(textRef.current.value)
    console.log(sdp)

    pc.current.setRemoteDescription(new RTCSessionDescription(sdp))

  }

  const addCandidate = () => {

    //const candidate = JSON.parse(textRef.current.value)
    //console.log('Adding Candidate...',candidate)

    candidates.current.forEach(candidate => {
      console.log(candidate)
      pc.current.addIceCandidate(new RTCIceCandidate(candidate))
    })

    

  }

  const showHideButtons = () => {
    if(offerVisible) {
      return (
        <button onClick = {createOffer}>Call</button>
      ) 
    } else if(answerVisible) {
      return (
        <button onClick = {createAnswer}>Answer</button>
      )
    }
  }
  return (
    <div style = {{margin: 10}}>
     
      <video 
      style = {{
        width: 240, height: 240,
        margin: 5, backgroundColor: 'black',
      }}
      
      ref = {localVideoRef} autoPlay></video>
      <video 
      style = {{
        width: 240, height: 240,
        margin: 5, backgroundColor: 'black',
      }}
      ref = {remoteVideoRef} autoPlay></video>

      <br />
      
      {showHideButtons()}
      <div>{status}</div>
      <textarea ref = {textRef}></textarea>
      

    </div>
  );
}

export default App;
