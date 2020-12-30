import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const ShowUser = (props) => {
  const [dataChart, setDataChart] = useState({})
  const [dataChart2, setDataChart2] = useState({})
  const [startDate, setStartDate] = useState('2019-01-01')
  const [endDate, setEndDate] = useState('2020-01-31')

  useEffect(() => {
    const getUsersInfos = async () => {
      let result = await fetch(`http://localhost:8080/messages/${startDate}/${endDate}`)
      let messages = await result.json()
      console.log(messages)

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
          label: 'number of message per hour, number of a voir selon ce que je veux',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 0.2)',
          data: y,
          fill: false,
        }]
      })

      // let [y1, m1, d1] = startDate.split('-')
      // let [y2, m2, d2] = endDate.split('-')
      // let deltaMonth = (Number(y2) - Number(y1)) * 12 + Number(m2) - Number(m1) + 1
      // let xx = new Array(deltaMonth).fill().map((e, id) => id + 'oui')
      // let xxx = new Array(deltaMonth).fill().map((e, id) => id + 'o')
      // let yy = new Array(deltaMonth).fill(0)
      // for (let message of messages) {
      //   let month = message.month
      //   let year = message.year
      //   let deltaFromStart = (year - y1) * 12 + month - m1
      //   yy[deltaFromStart] += 1
      // }
      // console.log(deltaMonth)
      
      // setDataChart2({
      //   labels: xx,
      //   datasets: [{
      //     label: 'number of message per hour, number of a voir selon ce que je veux',
      //     backgroundColor: 'rgba(255, 99, 132, 0.2)',
      //     borderColor: 'rgba(255, 99, 132, 0.2)',
      //     data: yy,
      //     fill: false,
      //   }]
      // })

      let [y1, m1, d1] = startDate.split('-')
      let [y2, m2, d2] = endDate.split('-')
      let start = new Date(`${m1}/${d1}/${y1}`)
      let end = new Date(`${m2}/${d2}/${y2}`)
      
      let deltaDay = Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1
      console.log(deltaDay)
      let xx = new Array(deltaDay).fill().map((e, id) => '')
      let yy = new Array(deltaDay).fill(0)
      for (let message of messages) {
        let day = message.day
        let month = message.month
        let year = message.year
        let currentDate = new Date(`${month}/${day}/${year}`) 
        let daysFromStart = (currentDate - start) / (24 * 60 * 60 * 1000)

        yy[daysFromStart] += 1
      }
      
      setDataChart2({
        labels: xx,
        datasets: [{
          label: 'number of message per hour, number of a voir selon ce que je veux',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 0.2)',
          data: yy,
          fill: false,
        }]
      })

    }
    getUsersInfos()
  }, [startDate, endDate])

  return (
    <>
      <label for="start">Start date:</label>
      <input type="date" id="start" name="trip-start" value={startDate} onChange={e => setStartDate(e.target.value)}></input>
      <label for="start">End date:</label>
      <input type="date" id="start" name="trip-start" value={endDate} onChange={e => setEndDate(e.target.value)}></input>
      <Line data={dataChart} />
      <Line data={dataChart2} />
    </>
  )
}

export default ShowUser