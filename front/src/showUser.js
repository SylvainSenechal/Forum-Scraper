import React, { useState, useEffect } from 'react';

const ShowUser = (props) => {
  const [data, setData] = useState([])

  useEffect( () => {
    const getUserInfos = async () => {
      let user = 'chimere'
      let result = await fetch(`http://localhost:8080/messages/${user}`)
      // console.log(await result.text())
      
      setData(await result.json())
    }
    getUserInfos()
  }, [])

  return (
    <>
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

export default ShowUser