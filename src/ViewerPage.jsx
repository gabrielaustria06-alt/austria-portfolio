import React, { useState, useEffect } from "react";
import './ViewerPage.css'; // Import custom CSS for aesthetics

const ViewerPage = () => {
    const [rotation, setRotation] = useState(0); // Rotation angle of the image
    const [currentImage, setCurrentImage] = useState(0); // Track the current image index
    const images = [
        '/assets/f1.1.png',  // Image for floor 1, first angle (front view)
        '/assets/f1.2.png',  // Image for floor 1, second angle (side view)
        '/assets/f2.1.png',  // Image for floor 2, first angle
        '/assets/f2.2.png',  // Image for floor 2, second angle
    ];

    // Function to navigate between images (left or right)
    const navigateImage = (direction) => {
        setCurrentImage((prev) => {
            if (direction === "left") {
                return prev === 0 ? images.length - 1 : prev - 1;
            }
            return prev === images.length - 1 ? 0 : prev + 1;
        });
    };

    // Function to rotate the image
    const rotateImage = (direction) => {
        setRotation((prev) => {
            const newRotation = direction === "left" ? prev - 90 : prev + 90;
            return newRotation % 360;
        });
    };

    useEffect(() => {
        // Initial loading of the panorama
        // Update the image based on the current index
    }, [currentImage]);

    return (
        <div className="viewer-container">
            <div 
                id="panorama" 
                className="panorama"
                style={{
                    transform: `rotateY(${rotation}deg)`, // Rotate the image
                    backgroundImage: `url(${images[currentImage]})`, 
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            ></div>
            <div className="controls">
                <button onClick={() => navigateImage('left')} className="nav-button left">←</button>
                <button onClick={() => navigateImage('right')} className="nav-button right">→</button>
                <button onClick={() => rotateImage('left')} className="nav-button rotate-left">↻</button>
                <button onClick={() => rotateImage('right')} className="nav-button rotate-right">↺</button>
            </div>
        </div>
    );
};

export default ViewerPage;