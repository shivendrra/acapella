import React from 'react';
import { useParams } from 'react-router-dom';

const ArtistPage = () => {
    const { id } = useParams();
    return <div className="p-8">Artist Page Placeholder for ID: {id}</div>
};

export default ArtistPage;
