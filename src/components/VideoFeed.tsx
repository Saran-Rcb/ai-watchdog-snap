import React from 'react';

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ videoRef }) => {
  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg border border-gray-200"
      />
    </div>
  );
};

export default VideoFeed;