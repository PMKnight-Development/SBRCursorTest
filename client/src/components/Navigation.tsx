import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Phone,
  LocalShipping,
  Map,
  AdminPanelSettings,
  Notifications,
  Person,
  Logout,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { io, Socket } from 'socket.io-client';
import { useContext } from 'react';
import { ColorModeContext } from '../App';

const drawerWidth = 200; // Shrink expanded navbar
const collapsedDrawerWidth = 64; // Restore collapsed width

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Calls', icon: <Phone />, path: '/calls' },
  { text: 'Units', icon: <LocalShipping />, path: '/units' },
  { text: 'Map', icon: <Map />, path: '/map' },
  { text: 'Admin', icon: <AdminPanelSettings />, path: '/admin' },
  { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
  { text: 'Profile', icon: <Person />, path: '/profile' },
];

const Navigation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [socketStatus, setSocketStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const dataState = useRef<Record<string, any>>({}); // For future global state/context
  const colorMode = useContext(ColorModeContext);

  useEffect(() => {
    const socket: Socket = io(`http://${window.location.hostname}:3000`, {
      transports: ['websocket'],
      reconnection: true,
    });
    setSocketStatus('connecting');
    socket.on('connect', () => setSocketStatus('connected'));
    socket.on('disconnect', () => setSocketStatus('disconnected'));
    socket.on('connect_error', () => setSocketStatus('disconnected'));

    // Future-proof: subscribe to all *:update events
    socket.onAny((event, data) => {
      if (event.endsWith(':update')) {
        const type = event.replace(':update', '');
        dataState.current[type] = data;
        // Optionally, update a global context or trigger a re-render
        // For now, just log:
        if (!['calls', 'units'].includes(type)) {
          console.log(`Live update for ${type}:`, data);
        }
      }
    });
    return () => { socket.disconnect(); };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed((prev) => !prev);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: collapsed ? 'center' : 'flex-start', px: 2 }}>
        <img
          src={process.env.PUBLIC_URL + '/icons/android-chrome-192x192.png'}
          alt="App Icon"
          style={{ width: 36, height: 36, marginRight: collapsed ? 0 : 12, transition: 'margin 0.2s' }}
        />
        {!collapsed && (
          <Typography variant="h6" noWrap component="div">
            SBR CAD
          </Typography>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {/* Live Data Indicator at bottom */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        px: 0,
        pb: 1.5,
        position: 'sticky',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 1,
        background: 'inherit',
        borderTop: '1px solid #e0e0e0',
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          justifyContent: collapsed ? 'center' : 'flex-start',
          pl: collapsed ? 0 : 2,
        }}>
          <Box className="pulse" sx={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor:
              socketStatus === 'connected' ? '#4caf50' :
              socketStatus === 'connecting' ? '#ffeb3b' :
              '#f44336',
            boxShadow:
              socketStatus === 'connected' ? '0 0 0 2px #4caf5044' :
              socketStatus === 'connecting' ? '0 0 0 2px #ffeb3b44' :
              '0 0 0 2px #f4433644',
            transition: 'background 0.2s, box-shadow 0.2s',
            mr: collapsed ? 0 : 1,
            ml: 0,
          }} />
          {!collapsed && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: 0.5, lineHeight: 1, mb: 0.2 }}>
                Live Data
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color:
                    socketStatus === 'connected' ? '#4caf50' :
                    socketStatus === 'connecting' ? '#ff9800' :
                    '#f44336',
                  fontWeight: 600,
                  fontSize: '0.75em',
                  lineHeight: 1.1,
                  mt: 0.2,
                  textAlign: 'left',
                  minWidth: 80,
                  transition: 'color 0.2s',
                }}
              >
                {socketStatus === 'connected' && 'Connected'}
                {socketStatus === 'connecting' && 'Connecting...'}
                {socketStatus === 'disconnected' && 'Disconnected'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh' }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          flexBasis: collapsed ? collapsedDrawerWidth : drawerWidth,
          width: collapsed ? collapsedDrawerWidth : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: collapsed ? collapsedDrawerWidth : drawerWidth,
            transition: 'width 0.2s',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="collapse drawer"
              edge="start"
              onClick={handleCollapseToggle}
              sx={{ mr: 2, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <MenuIcon style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }} />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {/* Summit Bechtel Reserve CAD System removed as requested */}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton sx={{ mr: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
                {colorMode.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {user?.username}
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <style>{`
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
.pulse { animation: pulse 2s infinite; }
`}</style>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Navigation; 