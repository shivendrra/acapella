import React from 'react';
import './styles/Curator.css';

import workinprogress from './media/pictures/work in progress.png';

export default function Curator() {
  return (
    <>
      <div className="curatorLander">
        <div className="row">
          <div className="col-lg-12 container">
            <img src={workinprogress} alt="" style={{ width: '30%', margin: 'auto', display: 'flex' }} />
          </div>
        </div>
      </div>
    </>
  )
}