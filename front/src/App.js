import React, { useState, useEffect } from 'react';

const Example = (props) => {
  const [triggerScrap, setTriggerScrap] = useState(false)
  const [startPage, setStartPage] = useState(12100)
  const [endPage, setEndPage] = useState(12105)
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

  return (
    <>
      scrap from page n° <input type="text" value={startPage} onChange={e => setStartPage(e.target.value)} />
      scrap until page n° <input type="text" value={endPage} onChange={e => setEndPage(e.target.value)} />
      <button onClick={() => setTriggerScrap(true)}>
        Scrap those pages
      </button>
    </>
  )
}

export default Example