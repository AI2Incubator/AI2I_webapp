import React, { useState } from "react"
import axios from "axios"
import logo from "./logo.svg"
import "./App.css"

const callApi = async () => {
  const apiHostname = process.env.REACT_APP_API_HOSTNAME
  const apiUrl = apiHostname
    ? `https://${apiHostname}/api/call`
    : "http://localhost:5001/api/call"
  return axios.get(apiUrl).then((resp) => resp.data)
}

function App() {
  const [apiRes, setApiRes] = useState(-1)

  const handleClick = async (e) => {
    e.preventDefault()
    const res = await callApi()
    setApiRes(res["random_number"])
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          <button onClick={handleClick}>Call the API</button>
        </p>
        {apiRes >= 0 && <p>Result from API: {apiRes}</p>}
      </header>
    </div>
  )
}

export default App
