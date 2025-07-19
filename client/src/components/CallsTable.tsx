import React from 'react';
import {
  Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, Tooltip, Typography, IconButton, Button, TableContainer, TablePagination, Badge
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';

/**
 * Type definition for a call record.
 */
export interface Call {
  id: string;
  call_number: string;
  call_type: string;
  priority: number;
  status: string;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  caller_name?: string;
  caller_phone?: string;
  created_at: string;
  assigned_units: string[];
  updated_at: string;
  notes?: string;
  timeline?: any[];
}

/**
 * Props for the CallsTable component.
 */
interface CallsTableProps {
  calls: Call[];
  sortBy: keyof Call;
  sortOrder: 'asc' | 'desc';
  onSort: (column: keyof Call) => void;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onCallStatusUpdate: (callId: string, newStatus: string) => void;
  onViewCallDetails: (call: Call) => void;
  getPriorityColor: (priority: number) => string;
  getStatusColor: (status: string) => string;
  formatCallNumber: (call: Call) => string;
}

/**
 * Reusable table for displaying pending and active calls with sorting, tooltips, sticky header, and pagination.
 */
const CallsTable: React.FC<CallsTableProps> = ({
  calls,
  sortBy,
  sortOrder,
  onSort,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  onCallStatusUpdate,
  onViewCallDetails,
  getPriorityColor,
  getStatusColor,
  formatCallNumber,
}) => {
  // Table columns definition
  const columns: { id: keyof Call | 'actions' | 'formatted_call_number'; label: string; tooltip?: string }[] = [
    { id: 'formatted_call_number', label: 'Call #', tooltip: 'Format: YEAR-INCIDENT NUMBER' },
    { id: 'call_type', label: 'Type' },
    { id: 'priority', label: 'Priority', tooltip: '1 = Emergency, 2 = High, 3 = Medium, 4 = Low' },
    { id: 'status', label: 'Status', tooltip: 'Current status of the call' },
    { id: 'address', label: 'Address' },
    { id: 'created_at', label: 'Created' },
    { id: 'assigned_units', label: 'Assigned Units' },
    { id: 'actions', label: 'Actions' },
  ];

  // Handlers for pagination
  const handleChangePage = (_: React.MouseEvent | null, newPage: number) => {
    onPageChange(newPage);
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  return (
    <TableContainer sx={{ maxHeight: 600 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.id} sx={{ backgroundColor: 'background.paper', zIndex: 1 }}>
                {col.id !== 'actions' ? (
                  <Tooltip title={col.tooltip || ''} arrow>
                    <TableSortLabel
                      active={
                        (col.id === 'formatted_call_number' && sortBy === 'call_number') ||
                        (col.id !== 'formatted_call_number' && sortBy === col.id)
                      }
                      direction={sortOrder}
                      onClick={() =>
                        col.id === 'formatted_call_number'
                          ? onSort('call_number')
                          : col.id !== 'actions' && onSort(col.id as keyof Call)
                      }
                    >
                      {col.label}
                    </TableSortLabel>
                  </Tooltip>
                ) : (
                  col.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {calls.map((call) => (
            <TableRow key={call.id} hover sx={{ backgroundColor: call.status === 'pending' ? 'rgba(255, 244, 229, 0.7)' : 'rgba(232, 244, 253, 0.7)' }}>
              {/* Call # (formatted) */}
              <TableCell>
                <Tooltip title={call.status === 'pending' ? 'Pending' : 'Active/Assigned'}>
                  <Badge
                    color={call.status === 'pending' ? 'warning' : 'info'}
                    variant="dot"
                    sx={{ mr: 1 }}
                  />
                </Tooltip>
                <Typography variant="subtitle2" color={call.status === 'pending' ? 'error.main' : 'primary.main'}>
                  {formatCallNumber(call)}
                </Typography>
              </TableCell>
              {/* Type */}
              <TableCell>{call.call_type}</TableCell>
              {/* Priority with tooltip */}
              <TableCell>
                <Tooltip title={`Priority ${call.priority}: ${['', 'Emergency', 'High', 'Medium', 'Low'][call.priority] || ''}`} arrow>
                  <Typography variant="body2" color={getPriorityColor(call.priority)}>
                    {call.priority}
                  </Typography>
                </Tooltip>
              </TableCell>
              {/* Status with tooltip */}
              <TableCell>
                <Tooltip title={call.status.replace('-', ' ')} arrow>
                  <Typography variant="body2" color={getStatusColor(call.status)}>
                    {call.status.replace('-', ' ').toUpperCase()}
                  </Typography>
                </Tooltip>
              </TableCell>
              {/* Address */}
              <TableCell>{call.address}</TableCell>
              {/* Created */}
              <TableCell>{new Date(call.created_at).toLocaleString()}</TableCell>
              {/* Assigned Units */}
              <TableCell>{call.assigned_units.length > 0 ? call.assigned_units.join(', ') : 'None'}</TableCell>
              {/* Actions */}
              <TableCell>
                <Button
                  size="small"
                  variant="contained"
                  color={call.status === 'pending' ? 'primary' : 'secondary'}
                  onClick={() => onCallStatusUpdate(call.id, call.status === 'pending' ? 'dispatched' : 'cleared')}
                >
                  {call.status === 'pending' ? 'Dispatch' : 'Clear'}
                </Button>
                <IconButton size="small" onClick={() => onViewCallDetails(call)}>
                  <ViewIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {calls.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Typography variant="body2" color="textSecondary">No pending or active calls</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </TableContainer>
  );
};

export default CallsTable; 