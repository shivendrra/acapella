import React from 'react';
import { useParams } from 'react-router-dom';

const AlbumPage = () => {
    const { id } = useParams();
    return <div className="p-8">Album Page Placeholder for ID: {id}</div>
};

export default AlbumPage;