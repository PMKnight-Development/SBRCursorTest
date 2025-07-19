import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Autocomplete
} from '@mui/material';
import {
  Phone,
  LocationOn,
  Person,
  Description,
  PriorityHigh,
  CheckCircle,
  Warning,
  Info,
  ArrowForward,
  ArrowBack,
  Save,
  Cancel,
  Search,
  MyLocation
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from './AuthProvider';

interface ProtocolQuestion {
  id: string;
  question: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multi_select';
  required: boolean;
  options?: string[];
  order: number;
  conditional_logic?: {
    depends_on: string;
    condition: string;
    value: any;
  };
}

interface ProtocolWorkflow {
  id: string;
  name: string;
  description: string;
  questions: ProtocolQuestion[];
  priority_override?: number;
  unit_recommendations?: string[];
  response_plan?: string;
}

interface CallData {
  call_type_id: string;
  priority: number;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  caller_name: string;
  caller_phone: string;
  answers: Record<string, any>;
}

interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  score: number;
}

const ProtocolCallEntry: React.FC<{ onCallCreated?: (callId: string) => void }> = ({ onCallCreated }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [callTypes, setCallTypes] = useState<any[]>([]);
  const [selectedCallType, setSelectedCallType] = useState<string>('');
  const [protocolWorkflow, setProtocolWorkflow] = useState<ProtocolWorkflow | null>(null);
  const [callData, setCallData] = useState<CallData>({
    call_type_id: '',
    priority: 3,
    latitude: 37.7749,
    longitude: -81.4194,
    address: '',
    description: '',
    caller_name: '',
    caller_phone: '',
    answers: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [calculatedPriority, setCalculatedPriority] = useState(3);
  const [recommendedUnits, setRecommendedUnits] = useState<string[]>([]);
  const [responsePlan, setResponsePlan] = useState<string>('');
  
  // Geocoding state
  const [geocodeQuery, setGeocodeQuery] = useState('');
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [showGeocodeDialog, setShowGeocodeDialog] = useState(false);

  const { token } = useAuth();

  const steps = [
    'Select Call Type',
    'Protocol Questions',
    'Location & Caller',
    'Review & Create'
  ];

  useEffect(() => {
    fetchCallTypes();
  }, []);

  useEffect(() => {
    if (selectedCallType) {
      fetchProtocolWorkflow(selectedCallType);
    }
  }, [selectedCallType]);

  const fetchCallTypes = async () => {
    try {
      const response = await axios.get('/api/admin/call-types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCallTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch call types:', error);
      setError('Failed to load call types');
    }
  };

  const fetchProtocolWorkflow = async (callTypeId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/protocol/workflow/${callTypeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProtocolWorkflow(response.data);
      setCallData(prev => ({ ...prev, call_type_id: callTypeId }));
    } catch (error) {
      console.error('Failed to fetch protocol workflow:', error);
      setError('Failed to load protocol workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      setShowConfirmDialog(true);
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setCallData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value
      }
    }));
  };

  const handleProtocolSubmit = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/protocol/process`, {
        call_id: 'temp', // Will be updated after call creation
        answers: callData.answers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCalculatedPriority(response.data.calculated_priority);
      setRecommendedUnits(response.data.recommended_units);
      setResponsePlan(response.data.response_plan);
      setCallData(prev => ({ ...prev, priority: response.data.calculated_priority }));
    } catch (error) {
      console.error('Failed to process protocol:', error);
      setError('Failed to process protocol answers');
    } finally {
      setLoading(false);
    }
  };

  const handleGeocode = async (query: string) => {
    if (!query.trim()) {
      setGeocodeResults([]);
      return;
    }

    try {
      setGeocoding(true);
      const response = await axios.get(`/api/arcgis/geocode?address=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeocodeResults(response.data);
    } catch (error) {
      console.error('Geocoding failed:', error);
      setGeocodeResults([]);
    } finally {
      setGeocoding(false);
    }
  };

  const handleGeocodeSelect = (result: GeocodeResult) => {
    setCallData(prev => ({
      ...prev,
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude
    }));
    setGeocodeResults([]);
    setGeocodeQuery('');
    setShowGeocodeDialog(false);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCallData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          
          // Reverse geocode to get address
          handleReverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Failed to get current location');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };

  const handleReverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await axios.get(`/api/arcgis/geocode/reverse?lat=${lat}&lng=${lng}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.address) {
        setCallData(prev => ({
          ...prev,
          address: response.data.address
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const handleCreateCall = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/calls', callData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Process protocol with actual call ID
      await axios.post(`/api/protocol/process`, {
        call_id: response.data.id,
        answers: callData.answers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onCallCreated?.(response.data.id);
      setShowConfirmDialog(false);
      // Reset form
      setActiveStep(0);
      setCallData({
        call_type_id: '',
        priority: 3,
        latitude: 37.7749,
        longitude: -81.4194,
        address: '',
        description: '',
        caller_name: '',
        caller_phone: '',
        answers: {}
      });
      setSelectedCallType('');
      setProtocolWorkflow(null);
    } catch (error) {
      console.error('Failed to create call:', error);
      setError('Failed to create call');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (question: ProtocolQuestion) => {
    const value = callData.answers[question.id];

    switch (question.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={question.question}
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            required={question.required}
            sx={{ mb: 2 }}
          />
        );
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={question.question}
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value))}
            required={question.required}
            sx={{ mb: 2 }}
          />
        );
      case 'boolean':
        return (
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">{question.question}</FormLabel>
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value === 'true')}
            >
              <FormControlLabel value="true" control={<Radio />} label="Yes" />
              <FormControlLabel value="false" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        );
      case 'select':
        return (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{question.question}</InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              label={question.question}
              required={question.required}
            >
              {question.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'multi_select':
        return (
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">{question.question}</FormLabel>
            <FormGroup>
              {question.options?.map((option) => (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      checked={(value || []).includes(option)}
                      onChange={(e) => {
                        const currentValues = value || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option]
                          : currentValues.filter((v: string) => v !== option);
                        handleAnswerChange(question.id, newValues);
                      }}
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
          </FormControl>
        );
      default:
        return null;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Call Type
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Call Type</InputLabel>
              <Select
                value={selectedCallType}
                onChange={(e) => setSelectedCallType(e.target.value)}
                label="Call Type"
              >
                {callTypes.map((callType) => (
                  <MenuItem key={callType.id} value={callType.id}>
                    {callType.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedCallType && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6">
                    {callTypes.find(ct => ct.id === selectedCallType)?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {callTypes.find(ct => ct.id === selectedCallType)?.description}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Protocol Questions
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : protocolWorkflow ? (
              <Box>
                {protocolWorkflow.questions
                  .sort((a, b) => a.order - b.order)
                  .map((question) => (
                    <Box key={question.id} sx={{ mb: 3 }}>
                      {renderQuestion(question)}
                    </Box>
                  ))}
                <Button
                  variant="contained"
                  onClick={handleProtocolSubmit}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  Process Protocol
                </Button>
                {calculatedPriority !== 3 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Calculated Priority: {calculatedPriority}
                  </Alert>
                )}
                {recommendedUnits.length > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Recommended Units: {recommendedUnits.join(', ')}
                  </Alert>
                )}
                {responsePlan && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Response Plan: {responsePlan}
                  </Alert>
                )}
              </Box>
            ) : (
              <Typography>No protocol workflow found for this call type.</Typography>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Location & Caller Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={callData.address}
                    onChange={(e) => setCallData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address or click search"
                  />
                  <Tooltip title="Search Address">
                    <IconButton 
                      onClick={() => setShowGeocodeDialog(true)}
                      sx={{ alignSelf: 'flex-end' }}
                    >
                      <Search />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Use Current Location">
                    <IconButton 
                      onClick={handleUseCurrentLocation}
                      sx={{ alignSelf: 'flex-end' }}
                    >
                      <MyLocation />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={callData.latitude}
                  onChange={(e) => setCallData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={callData.longitude}
                  onChange={(e) => setCallData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={callData.description}
                  onChange={(e) => setCallData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Caller Name"
                  value={callData.caller_name}
                  onChange={(e) => setCallData(prev => ({ ...prev, caller_name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Caller Phone"
                  value={callData.caller_phone}
                  onChange={(e) => setCallData(prev => ({ ...prev, caller_phone: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Create Call
            </Typography>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">Call Summary</Typography>
                <Typography><strong>Type:</strong> {callTypes.find(ct => ct.id === callData.call_type_id)?.name}</Typography>
                <Typography><strong>Priority:</strong> {callData.priority}</Typography>
                <Typography><strong>Address:</strong> {callData.address}</Typography>
                <Typography><strong>Coordinates:</strong> {callData.latitude}, {callData.longitude}</Typography>
                <Typography><strong>Description:</strong> {callData.description}</Typography>
                <Typography><strong>Caller:</strong> {callData.caller_name} - {callData.caller_phone}</Typography>
              </CardContent>
            </Card>
            {recommendedUnits.length > 0 && (
              <Alert severity="info">
                Recommended Units: {recommendedUnits.join(', ')}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <Save /> : <ArrowForward />}
            disabled={loading}
          >
            {activeStep === steps.length - 1 ? 'Create Call' : 'Next'}
          </Button>
        </Box>
      </Paper>

      {/* Geocoding Dialog */}
      <Dialog open={showGeocodeDialog} onClose={() => setShowGeocodeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Search Address</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Enter address"
            value={geocodeQuery}
            onChange={(e) => {
              setGeocodeQuery(e.target.value);
              handleGeocode(e.target.value);
            }}
            sx={{ mb: 2 }}
            placeholder="Enter address to search..."
          />
          {geocoding && <CircularProgress size={20} sx={{ ml: 2 }} />}
          <List>
            {geocodeResults.map((result, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton onClick={() => handleGeocodeSelect(result)}>
                  <ListItemText
                    primary={result.address}
                    secondary={`Score: ${result.score.toFixed(2)} | ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGeocodeDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Create Call</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to create this call? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCall} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Create Call'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProtocolCallEntry; 