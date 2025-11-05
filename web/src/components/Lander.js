import React from 'react';
import "./styles/Lander.css";

import Navbar from './Navbar';

export default function Lander() {
  
  return (
    <>
    <div className='lander'>
      <div className="container">
        <Navbar/>
      </div>
      <div className="h3">
        <br /><br /><br />
        Hello
      </div>
    </div>
    </>
  )
}