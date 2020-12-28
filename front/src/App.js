// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;


import React, { useState, useEffect } from 'react';

const Example = (props) => {
  const [data, setData] = useState([])
  const [triggerScrap, setTriggerScrap] = useState(false)
  const [startPage, setStartPage] = useState(33)
  const [endPage, setEndPage] = useState(35)
  console.log(props)

  useEffect(async () => {
    const sendScrapOrder = async () => {
      if (triggerScrap) {
        setTriggerScrap(false)
        await fetch('http://localhost:8080/scratch', {
          method: 'POST', // *GET, POST, PUT, DELETE, etc.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({startPage: startPage, endPage: endPage}) // body data type must match "Content-Type" header
        })
      }
    }
    sendScrapOrder()
  }, [triggerScrap])

  useEffect(async () => {
    const sendScrapOrder = async () => {
      let user = 'chimere'
      let result = await fetch(`http://localhost:8080/messages/${user}`)
      // console.log(await result.text())
    
      setData(await result.json())
      console.log(data)
    }
    sendScrapOrder()
  }, [])

  return (
    <>
      scrap from page n° <input type="text" value={startPage} onChange={e => setStartPage(e.target.value)} />
      scrap until page n° <input type="text" value={endPage} onChange={e => setEndPage(e.target.value)} />
      <button onClick={() => setTriggerScrap(true)}>
        click me
      </button>
      <ul>
        {data.map(message => (
          <li key={message.idPost}> 
            Poster : <b>{message.namePoster}</b>, ID post : <b>{message.idPost}</b>, datePost : <b>{message.datePost} {message.timePost}</b>, page number : <b>{message.pageNumber}</b>
          </li>
        ))} 
      </ul>
    </>
  )
}

export default Example