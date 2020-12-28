import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const ShowUser = (props) => {
  const [dataChart, setDataChart] = useState({})

  useEffect(() => {
    const getUsersInfos = async () => {
      let minPage = 12000
      let maxPage = 12050
      let result = await fetch(`http://localhost:8080/messages/${minPage}/${maxPage}`)
      let messages = await result.json()
      console.log(messages)

      // // per day of month
      // let x = new Array(31).fill().map((e, id) => id + 1)
      // console.log(x)
      // let y = new Array(31).fill(0)
      // for (let message of messages) {
      //   y[message.day - 1] += 1
      // }
      // console.log(y)

      // // per day of week
      // let x = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      // console.log(x)
      // let y = new Array(7).fill(0)
      // for (let message of messages) {
      //   let d = new Date(message.year, message.month - 1, message.day)
      //   // console.log(message)
      //   // console.log(d)
      //   // console.log(d.getDay())
      //   y[d.getDay()] += 1
      // }
      // console.log(y)

      // per hour of the day
      let x = new Array(24).fill().map((e, id) => id)
      console.log(x)
      let y = new Array(24).fill(0)
      for (let message of messages) {
        let hour = message.timePost.split(':')[0]
        y[Number(hour)] += 1
      }
      console.log(y)

      setDataChart({
        labels: x,
        datasets: [{
          label: 'number of a voir selon ce que je veux',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 0.2)',
          data: y,
          fill: false,
        }]
      })
    }
    getUsersInfos()
  }, [])

  return (
    <>
      <Line data={dataChart} />
    </>
  )
}

export default ShowUser