import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaDownload, FaTrash } from "react-icons/fa6";
import { ContentContext } from './ContentContext.jsx';
import axios from "axios";
import '../App.css'

function Collection() {
    const navigate = useNavigate();
    const [collection, setCollection] = useState([]);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("Loading collection...");

    const { setImageData, setAudioBuffer, setLocation } = useContext(ContentContext);

    useEffect(() => {
        async function getCollection() {
            const collection = await axios.get(`${process.env.REACT_APP_API_URL}/collection`, { withCredentials: true });

            if (!collection.data || collection.data.length === 0) {
                setMessage("No items in collection");
            } else {
                setMessage("");
                setCollection(collection.data);
            }
        };

        getCollection();
    }, []);

    const selectImage = async (e) => {
        const index = e.currentTarget.id;
        
        const imageData = await axios.get(collection[index].imageURL, { responseType: 'blob' });
        setImageData(imageData.data);

        const audioData = await axios.get(collection[index].audioUrl, { responseType: 'arraybuffer' });
        setAudioBuffer(audioData.data);

        navigate('/generated', { state: { location: collection[e.currentTarget.id].location } });
    }

    const deleteItem = async (index) => {
        setLoading(true);
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/collection/${collection[index].uuid}`, { withCredentials: true });
            setCollection(prevCollection => prevCollection.filter((_, i) => i !== index));
        } catch (err) {
            console.log("Error deleting item: ", err);
        } finally {
            setLoading(false);
            setDeleteIndex(null);
        }
    };

    return (
        <div>
            <div className="collection-container">
                <h1 className="subtitle" style={{color: 'black', justifyContent: 'center'}}>{message}</h1>
                {deleteIndex !== null && (
                    <div className="blackout-overlay">
                        <div className="delete-confirmation-dialog">
                            <h3>Are You Sure You Want to Delete This Wallpaper?</h3>
                            <hr style={{borderTop: '2px solid white', borderRadius: '5px', margin: '1rem'}}/>
                            <button onClick={() => deleteItem(deleteIndex)} className="auth-button" style={{marginRight: '30px'}}>{loading ? "Deleting..." : "Yes, Delete Permanently"}</button>
                            <button onClick={() => setDeleteIndex(null)} className="auth-button">No</button>
                        </div>
                    </div>
                )}
                {collection.map((item, index) => (
                    <div key={index} className="collection-card" style={{ animationDelay: `${index * 0.15}s`}}>
                        <img src={`${item.imageURL}`} alt={item.location} className="collection-image"/>
                        <hr style={{borderTop: '2px solid white', borderRadius: '5px', margin: '1rem'}}/>
                        <div style={{display: 'flex', flexDirection: 'row'}}>
                            <p style={{margin: '1rem'}}>{item.location}</p>
                            <FaDownload id={index} onClick={selectImage} className="select-content-button"/>
                            <FaTrash id={index} onClick={() => setDeleteIndex(index)} className="delete-content-button" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Collection;