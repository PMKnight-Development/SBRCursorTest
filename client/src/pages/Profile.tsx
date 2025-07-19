import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
} from '@mui/material';
import {
  Person,
  Email,
  AdminPanelSettings,
  Security,
  AccessTime,
} from '@mui/icons-material';
import { useAuth } from '../components/AuthProvider';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Container>
        <Typography>Loading profile...</Typography>
      </Container>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'supervisor': return 'warning';
      case 'dispatcher': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your account information and settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: '2rem',
                  bgcolor: 'primary.main',
                  mr: 3,
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {user.username}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                <Chip
                  label={user.role}
                  color={getRoleColor(user.role) as any}
                  icon={<AdminPanelSettings />}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* User Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary="Username"
                    secondary={user.username}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={user.email}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <AdminPanelSettings />
                  </ListItemIcon>
                  <ListItemText
                    primary="Role"
                    secondary={user.role}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="User ID"
                    secondary={user.id}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <AccessTime />
                  </ListItemIcon>
                  <ListItemText
                    primary="Session Status"
                    secondary="Active"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="Authentication"
                    secondary="JWT Token"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <AdminPanelSettings />
                  </ListItemIcon>
                  <ListItemText
                    primary="Permissions"
                    secondary={user.role === 'admin' ? 'Full Access' : 'Limited Access'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 