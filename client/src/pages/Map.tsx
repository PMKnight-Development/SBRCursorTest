import React from 'react';
import { Box } from '@mui/material';
import ArcGISMap from '../components/ArcGISMap';

const Map: React.FC = () => {
  return (
    <Box sx={{ 
      height: '100%',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0,
      minHeight: 0,
      minWidth: 0
    }}>
      <ArcGISMap />
    </Box>
  );
};

export default Map; 