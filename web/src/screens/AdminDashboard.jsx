import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Logout, CheckCircle, Cancel, Visibility, Refresh } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import facilitiesData from '../data/facilities.json';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [groupedSubmissions, setGroupedSubmissions] = useState({});
  const [insights, setInsights] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [reviewDialog, setReviewDialog] = useState({ open: false, submission: null });
  const [reviewReason, setReviewReason] = useState('');
  
  // Create facility mapping
  const facilityMap = React.useMemo(() => {
    const map = {};
    facilitiesData.forEach(facility => {
      map[facility.facility_code] = {
        name: facility.facility_name,
        district: facility.district,
        facility_type: facility.facility_type
      };
    });
    return map;
  }, []);
  
  const getFacilityName = (facilityId) => {
    return facilityMap[facilityId]?.name || facilityId;
  };

  const getFacilityDistrict = (facilityId) => {
    return facilityMap[facilityId]?.district || 'N/A';
  };

  const getFacilityDetails = (submission) => {
    // Try to get from facilityDetails in submission, or from facilityId
    if (submission.facilityDetails) {
      return {
        district: submission.facilityDetails.district || 'N/A',
        site: submission.facilityDetails.facility_name || submission.facilityDetails.facility_code || 'N/A'
      };
    }
    return {
      district: getFacilityDistrict(submission.facilityId),
      site: getFacilityName(submission.facilityId)
    };
  };

  const getAttendanceFacilityDetails = (record) => {
    if (record.facilityDetails) {
      return {
        district: record.facilityDetails.district || 'N/A',
        site: record.facilityDetails.facility_name || record.facilityDetails.facility_code || 'N/A'
      };
    }
    return {
      district: 'N/A',
      site: 'N/A'
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Load critical data first (insights for dashboard cards)
      const insightsRes = await apiClient.get('/api/admin/dashboard/insights');
      setInsights(insightsRes.data);
      
      // Then load other data in parallel (non-blocking)
      Promise.all([
        apiClient.get('/api/admin/submissions'),
        apiClient.get('/api/admin/submissions/by-facility'),
        apiClient.get('/api/admin/attendance'),
      ]).then(([submissionsRes, groupedRes, attendanceRes]) => {
      setSubmissions(submissionsRes.data);
      setGroupedSubmissions(groupedRes.data);
      setAttendance(attendanceRes.data);
      }).catch((error) => {
        console.error('Error loading secondary data:', error);
        // Don't show error toast for secondary data, just log it
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 403) {
        toast.error('Admin access required');
        await logout();
        navigate('/login');
      } else {
        toast.error('Error loading dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action) => {
    if (!reviewDialog.submission) return;

    try {
      await apiClient.post(`/api/admin/submissions/${reviewDialog.submission._id}/review`, {
        action,
        reason: reviewReason,
      });
      toast.success(`Submission ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setReviewDialog({ open: false, submission: null });
      setReviewReason('');
      fetchData();
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast.error('Error reviewing submission');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'submitted':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderAllSubmissions = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>District</TableCell>
            <TableCell>Site Name</TableCell>
            <TableCell>Vendor (Username)</TableCell>
            <TableCell>Submitted By</TableCell>
            <TableCell>Submitted At</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Review Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {submissions.map((submission) => {
            const facilityDetails = getFacilityDetails(submission);
            return (
              <TableRow key={submission._id}>
                <TableCell>{facilityDetails.district}</TableCell>
                <TableCell>{facilityDetails.site}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {submission.userId?.username || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {submission.submittedByName || submission.userId?.name || submission.userId?.username || 'Unknown'}
                </TableCell>
                <TableCell>
                  {submission.submittedAt
                    ? new Date(submission.submittedAt).toLocaleString()
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={submission.status}
                    color={getStatusColor(submission.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {submission.approvalStatus?.reviewStatus ? (
                    <Chip
                      label={submission.approvalStatus.reviewStatus}
                      color={
                        submission.approvalStatus.reviewStatus === 'approved'
                          ? 'success'
                          : submission.approvalStatus.reviewStatus === 'rejected'
                          ? 'error'
                          : 'warning'
                      }
                      size="small"
                    />
                  ) : (
                    <Chip label="pending" color="warning" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {submission.customerEnd?.siteVideo && (
                      <Chip
                        label="Video"
                        color="info"
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/ic-preview?id=${submission._id}`)}
                    >
                      View
                    </Button>
                    {submission.status === 'submitted' && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() =>
                            setReviewDialog({ open: true, submission })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() =>
                            setReviewDialog({ open: true, submission })
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderByFacility = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {Object.entries(groupedSubmissions).map(([facilityId, facilitySubmissions]) => {
        const facilityDetails = facilitySubmissions[0] ? getFacilityDetails(facilitySubmissions[0]) : { district: getFacilityDistrict(facilityId), site: getFacilityName(facilityId) };
        return (
          <Paper key={facilityId} sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Site: {facilityDetails.site} ({facilitySubmissions.length} submissions)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                District: {facilityDetails.district}
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor (Username)</TableCell>
                    <TableCell>Submitted By</TableCell>
                    <TableCell>Submitted At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Review Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {facilitySubmissions.map((submission) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {submission.userId?.username || 'N/A'}
                        </Typography>
                      </TableCell>
                    <TableCell>
                      {submission.submittedByName || submission.userId?.name || submission.userId?.username || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {submission.submittedAt
                        ? new Date(submission.submittedAt).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={submission.status}
                        color={getStatusColor(submission.status)}
                        size="small"
                      />
                    </TableCell>
                      <TableCell>
                        {submission.approvalStatus?.reviewStatus ? (
                          <Chip
                            label={submission.approvalStatus.reviewStatus}
                            color={
                              submission.approvalStatus.reviewStatus === 'approved'
                                ? 'success'
                                : submission.approvalStatus.reviewStatus === 'rejected'
                                ? 'error'
                                : 'warning'
                            }
                            size="small"
                          />
                        ) : (
                          <Chip label="pending" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {submission.customerEnd?.siteVideo && (
                            <Chip
                              label="Video"
                              color="info"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => navigate(`/ic-preview?id=${submission._id}`)}
                          >
                            View
                          </Button>
                          {submission.status === 'submitted' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() =>
                                  setReviewDialog({ open: true, submission })
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() =>
                                  setReviewDialog({ open: true, submission })
                                }
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {user?.role === 'vendor' ? 'Vendor Dashboard' : 'Admin Dashboard'}
          </Typography>
          <IconButton color="inherit" onClick={fetchData} sx={{ mr: 1 }}>
            <Refresh />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, pb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {insights && (
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Submissions
                      </Typography>
                      <Typography variant="h4">{insights.totalSubmissions}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Pending Review
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {insights.pendingSubmissions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Approved
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {insights.approvedSubmissions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Rejected
                      </Typography>
                      <Typography variant="h4" color="error.main">
                        {insights.rejectedSubmissions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="All Submissions" />
                <Tab label="By Facility" />
                <Tab label="Attendance" />
              </Tabs>
            </Paper>

            {activeTab === 0 && renderAllSubmissions()}
            {activeTab === 1 && renderByFacility()}
            {activeTab === 2 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>District</TableCell>
                      <TableCell>Site</TableCell>
                      <TableCell>Vendor (Username)</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Selfie</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="text.secondary">No attendance records found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendance.map((record) => {
                        const facilityDetails = getAttendanceFacilityDetails(record);
                        return (
                          <TableRow key={record._id}>
                            <TableCell>{facilityDetails.district}</TableCell>
                            <TableCell>{facilityDetails.site}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {record.userId?.username || record.username || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {record.userId?.name || record.name || record.username || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={record.attendanceType}
                                color={record.attendanceType === 'Check In' ? 'success' : 'info'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{record.location?.name || 'N/A'}</TableCell>
                            <TableCell>
                              {record.timestamp
                                ? new Date(record.timestamp).toLocaleString()
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Avatar
                                src={record.selfieUrl}
                                sx={{ width: 56, height: 56, cursor: 'pointer' }}
                                onClick={() => window.open(record.selfieUrl, '_blank')}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Container>

      <Dialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, submission: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {reviewDialog.submission?.status === 'submitted'
            ? 'Review Submission'
            : 'Update Review'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review Reason (Optional)"
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Enter reason for approval or rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ open: false, submission: null })}>
            Cancel
          </Button>
          <Button
            onClick={() => handleReview('reject')}
            color="error"
            variant="contained"
            startIcon={<Cancel />}
          >
            Reject
          </Button>
          <Button
            onClick={() => handleReview('approve')}
            color="success"
            variant="contained"
            startIcon={<CheckCircle />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;

