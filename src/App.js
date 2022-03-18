import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  FaUserCircle,
  FaCheckCircle,
  FaTimes,
  FaShareAlt,
  FaHourglass,
} from "react-icons/fa";

function App() {
  const [photos, setPhotos] = useState([]);
  const [shareModal, setShareModal] = useState(false);

  const ws = new WebSocket("ws://localhost:3001/ws");

  useEffect(() => {
    fetch("http://localhost:3001/photos")
      .then((res) => res.json())
      .then((data) => {
        let unique = [
          ...new Map(
            data.photos.map((photo) => [photo["url"], photo])
          ).values(),
        ];
        setPhotos(unique);
      });
  }, []);

  useEffect(() => {
    ws.onmessage = (e) => {
      const message = JSON.parse(e.data);
      setPhotos((photos) => {
        let updatedPhotos = [...photos];
        let index = updatedPhotos.findIndex(
          (photo) => photo.id === message.photo.id
        );
        updatedPhotos[index].website = message.photo.website;
        return updatedPhotos;
      });
    };
  }, []);

  const handleSelect = (id) => {
    let updatedPhotos = [...photos];
    let index = updatedPhotos.findIndex((photo) => photo.id === id);
    updatedPhotos[index].website = updatedPhotos[index].website
      ? null
      : "TO_BE_SENT";
    setPhotos(updatedPhotos);
  };

  const handleClear = () => {
    let updatedPhotos = [...photos];
    updatedPhotos.map((photo) => (photo.website = null));
    setPhotos(updatedPhotos);
    setShareModal(false);
  };

  const handleToggleShareModal = () => {
    setShareModal(!shareModal);
  };

  const handleCancel = () => {
    setShareModal(false);
  };

  const handleShare = () => {
    let selectedIDs = photos.reduce((ids, photo) => {
      if (photo.website === "TO_BE_SENT") {
        ids.push(photo.id);
      }
      return ids;
    }, []);

    let updatedPhotos = [...photos];

    Promise.all(
      selectedIDs.map((id) =>
        fetch(`http://localhost:3001/website/photos/${id}`, {
          method: "POST",
        })
          .then((res) => res.json())
          .then((data) => {
            let index = updatedPhotos.findIndex(
              (photo) => photo.id === data.photo.id
            );
            updatedPhotos[index].website = data.photo.website;
          })
      )
    ).then(() => {
      setPhotos(updatedPhotos);
      setShareModal(false);
    });
  };

  return (
    <div className="App">
      {photos && photos.length > 0 && (
        <div className="photoGrid">
          {photos.map((photo) => (
            <Photo
              key={photo.id}
              url={photo.url}
              website={photo.website}
              onSelect={() => {
                handleSelect(photo.id);
              }}
            />
          ))}
        </div>
      )}
      {shareModal && (
        <ShareModal
          count={
            photos.filter((photo) => photo.website === "TO_BE_SENT").length
          }
          cancelModal={handleCancel}
          sharePhotos={handleShare}
        />
      )}
      <Footer
        count={photos.filter((photo) => photo.website === "TO_BE_SENT").length}
        clearSelection={handleClear}
        toggleShareModal={handleToggleShareModal}
      />
    </div>
  );
}

const ShareModal = ({ count, cancelModal, sharePhotos }) => {
  return (
    <div className="shareModal">
      Send {count} photos to website?
      <div className="modalButtons">
        <button className="button cancelButton" onClick={cancelModal}>
          Cancel
        </button>
        <button className="button shareButton" onClick={sharePhotos}>
          Send to Website
        </button>
      </div>
      <div className="triangle"></div>
    </div>
  );
};

ShareModal.propTypes = {
  count: PropTypes.number.isRequired,
  cancelModal: PropTypes.func.isRequired,
  sharePhotos: PropTypes.func.isRequired,
};

const Photo = ({ url, website, onSelect }) => {
  return (
    <div
      className={
        website === null || website === "TO_BE_SENT"
          ? website === null
            ? "photoContainer photoContainerHover"
            : "photoContainer photoContainerSelected"
          : "photoContainer "
      }
      onClick={website === null || website === "TO_BE_SENT" ? onSelect : null}
    >
      <img className="photo" src={url} loading="lazy" />
      {(website === null || website === "TO_BE_SENT") && (
        <FaCheckCircle className="check" size={30} />
      )}
      {website === "PENDING_APPROVAL" && (
        <FaHourglass className="hourglass" color="#fff" size={90} />
      )}
      {website === "WEBSITE_APPROVED" && (
        <FaShareAlt className="shared" color="#fff" size={30} />
      )}
    </div>
  );
};

Photo.propTypes = {
  url: PropTypes.string.isRequired,
  website: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

const Footer = ({ count, clearSelection, toggleShareModal }) => {
  return (
    <div className="footerBar">
      {count > 0 && (
        <div className="footerSection left">
          <FaTimes
            className="pointer"
            color="rgb(120,136,150)"
            size={30}
            onClick={clearSelection}
          />
          <div>{count} Selected</div>
        </div>
      )}
      <div className="footerSection right">
        {count > 0 && (
          <FaShareAlt
            className="pointer"
            color="rgb(120,136,150)"
            size={30}
            onClick={toggleShareModal}
          />
        )}
        <FaUserCircle color="rgb(120,136,150)" size={30} />
      </div>
    </div>
  );
};

Footer.propTypes = {
  count: PropTypes.number.isRequired,
  clearSelection: PropTypes.func.isRequired,
  toggleShareModal: PropTypes.func.isRequired,
};

export default App;
