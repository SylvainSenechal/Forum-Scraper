import React, { useState, useEffect } from 'react';

const ShowUser = (props) => {
  const [data, setData] = useState([])
  const [username, setUsername] = useState('chimere')

  useEffect( () => {
    const getUserInfos = async () => {
      let result = await fetch(`http://localhost:8080/messages/${username}`)
      // console.log(await result.text())
      
      setData(await result.json())
    }
    getUserInfos()
  }, [username])

  return (
    <>
      Show message from username : <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
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