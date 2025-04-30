import React from 'react';
import './styles/Music.css';

import workinprogress from './media/pictures/work in progress.png';

export default function Music() {
  return (
    <>
      <div className="musicLander">
        <div className="row">
          <div className="col-lg-12 container">
              <img src={workinprogress} alt="" style={{ width: '30%', margin: 'auto', display: 'flex'}}/>
          </div>
        </div>
      </div>
    </>
  )
}