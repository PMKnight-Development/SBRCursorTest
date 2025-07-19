import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Info,
  Warning,
  Error,
  CheckCircle,
  Delete,
  MarkEmailRead,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../components/AuthProvider';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info color="info" />;
      case 'warning': return <Warning color="warning" />;
      case 'error': return <Error color="error" />;
      case 'success': return <CheckCircle color="success" />;
      default: return <NotificationIcon />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading notifications...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          System notifications and alerts
        </Typography>
      </Box>

      <Paper>
        <List>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No notifications"
                secondary="You're all caught up!"
              />
            </ListItem>
          ) : (
            notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'transparent' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {notification.title}
                        {!notification.read && (
                          <Chip
                            label="New"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        <Chip
                          label={notification.type}
                          size="small"
                          color={getNotificationColor(notification.type) as any}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box>
                    {!notification.read && (
                      <IconButton
                        size="small"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <MarkEmailRead />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete notification"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
    </Container>
  );
};

export default Notifications; 