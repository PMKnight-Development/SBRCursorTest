import React from 'react';
import {
  Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, Tooltip, Typography, IconButton, Button, TableContainer, TablePagination, Chip, TextField, Box
} from '@mui/material';
import { Visibility as ViewIcon, Search as SearchIcon } from '@mui/icons-material';

export interface Unit {
  id: string;
  unit_number: string;
  unit_name: string;
  unit_type: string;
  status: string;
  last_status_update: string;
  group_name?: string;
  group_id?: string;
  current_latitude?: number;
  current_longitude?: number;
  assigned_call_id?: string;
  is_active?: boolean;
  created_at?: string;
}

interface UnitsTableProps {
  units: Unit[];
  sortBy: keyof Unit;
  sortOrder: 'asc' | 'desc';
  onSort: (column: keyof Unit) => void;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onStatusUpdate: (unitId: string, newStatus: string) => void;
  onViewUnitDetails: (unit: Unit) => void;
  getStatusColor: (status: string) => string;
  getUnitTypeColor: (type: string) => string;
  search: string;
  onSearchChange: (value: string) => void;
}

const UnitsTable: React.FC<UnitsTableProps> = ({
  units,
  sortBy,
  sortOrder,
  onSort,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  onStatusUpdate,
  onViewUnitDetails,
  getStatusColor,
  getUnitTypeColor,
  search,
  onSearchChange,
}) => {
  const columns: { id: keyof Unit | 'actions'; label: string; tooltip?: string }[] = [
    { id: 'unit_number', label: 'Unit #' },
    { id: 'unit_name', label: 'Name' },
    { id: 'unit_type', label: 'Type' },
    { id: 'status', label: 'Status' },
    { id: 'last_status_update', label: 'Last Update' },
    { id: 'actions', label: 'Actions' },
  ];

  // Filter units by search string
  const filteredUnits = React.useMemo(() => {
    if (!search.trim()) return units;
    const lower = search.toLowerCase();
    return units.filter(unit =>
      (unit.unit_number && unit.unit_number.toLowerCase().includes(lower)) ||
      (unit.unit_name && unit.unit_name.toLowerCase().includes(lower)) ||
      (unit.unit_type && unit.unit_type.toLowerCase().includes(lower)) ||
      (unit.status && unit.status.toLowerCase().includes(lower)) ||
      (unit.last_status_update && unit.last_status_update.toLowerCase().includes(lower)) ||
      (unit.group_name && unit.group_name.toLowerCase().includes(lower))
    );
  }, [units, search]);

  const handleChangePage = (_: React.MouseEvent | null, newPage: number) => {
    onPageChange(newPage);
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1 }}>
        <TextField
          placeholder="Search units..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ color: 'action.active', mr: 1, ml: 0.5, fontSize: 20 }} />
            ),
            sx: {
              borderRadius: 2,
              backgroundColor: (theme) => theme.palette.background.paper,
              color: (theme) => theme.palette.text.primary,
              boxShadow: (theme) => theme.shadows[1],
              fontSize: 15,
              px: 1.5,
              py: 0.5,
              minWidth: 240,
              maxWidth: 340,
              height: 40,
              border: '1px solid',
              borderColor: (theme) => theme.palette.divider,
              transition: 'box-shadow 0.2s, border-color 0.2s',
              '&:focus-within': {
                boxShadow: (theme) => theme.shadows[4],
                borderColor: (theme) => theme.palette.primary.main,
              },
            },
          }}
          inputProps={{
            style: { padding: '8px 0 8px 0', fontSize: 15 },
          }}
        />
      </Box>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} sx={{ backgroundColor: 'background.paper', zIndex: 1 }}>
                  {col.id !== 'actions' ? (
                    <Tooltip title={col.tooltip || ''} arrow>
                      <TableSortLabel
                        active={sortBy === col.id}
                        direction={sortOrder}
                        onClick={() => onSort(col.id as keyof Unit)}
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
            {filteredUnits.map((unit) => (
              <TableRow key={unit.id} hover>
                <TableCell>{unit.unit_number}</TableCell>
                <TableCell>{unit.unit_name}</TableCell>
                <TableCell>
                  <Chip
                    label={unit.unit_type.replace('_', ' ').toUpperCase()}
                    color={getUnitTypeColor(unit.unit_type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={unit.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(unit.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(unit.last_status_update).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onStatusUpdate(unit.id, unit.status === 'available' ? 'out_of_service' : 'available')}
                  >
                    {unit.status === 'available' ? 'Out of Service' : 'Set Available'}
                  </Button>
                  <IconButton size="small" onClick={() => onViewUnitDetails(unit)}>
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredUnits.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body2" color="textSecondary">No units found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredUnits.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </Box>
  );
};

export default UnitsTable; 