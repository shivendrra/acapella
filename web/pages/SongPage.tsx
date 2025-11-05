import React from 'react';
import { useParams } from 'react-router-dom';

const SongPage = () => {
    const { id } = useParams();
    return <div className="p-8">Song Page Placeholder for ID: {id}</div>
};

export default SongPage;
