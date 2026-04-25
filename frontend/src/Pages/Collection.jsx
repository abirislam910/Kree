import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaDownload } from "react-icons/fa6";
import { ContentContext } from './ContentContext.jsx';
import axios from "axios";
import '../App.css'

function Collection() {
    const navigate = useNavigate();
    const [collection, setCollection] = useState([]);
    const [message, setMessage] = useState("Loading collection...");

    const { setImageData, setAudioBuffer, setLocation } = useContext(ContentContext);

    useEffect(() => {
        async function getCollection() {

            const collection = await axios.get(`${process.env.REACT_APP_API_URL}/collection`, { withCredentials: true });
            console.log("Collection data retrieved successfully:", collection.data);

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
        
        setLocation(collection[index].location);

        const imageData = await axios.get(collection[index].imageURL, { responseType: 'blob' });
        setImageData(imageData.data);

        const audioData = await axios.get(collection[index].audioUrl, { responseType: 'arraybuffer' });
        setAudioBuffer(audioData.data);

        navigate('/generated');
    }

    return (
        <div>
            <div className="collection-container">
                <h1 className="subtitle" style={{color: 'black', justifyContent: 'center'}}>{message}</h1>
                {collection.map((item, index) => (
                    <div id={index} key={index} className="collection-card" onClick={selectImage} style={{ animationDelay: `${index * 0.15}s`, cursor: 'pointer' }}>
                        <img src={`${item.imageURL}`} alt={item.location} className="collection-image"/>
                        <hr style={{borderTop: '2px solid white', borderRadius: '5px', margin: '1rem'}}/>
                        <div style={{display: 'flex', flexDirection: 'row'}}>
                            <FaDownload style={{margin: '1rem'}}/>
                            <p style={{margin: '1rem'}}>{item.location}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Collection;