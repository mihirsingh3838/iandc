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
} from '@mui/material';
import { Logout, CheckCircle, Cancel, Visibility, Refresh } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [groupedSubmissions, setGroupedSubmissions] = useState({});
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [reviewDialog, setReviewDialog] = useState({ open: false, submission: null });
  const [reviewReason, setReviewReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [submissionsRes, groupedRes, insightsRes] = await Promise.all([
        apiClient.get('/api/admin/submissions'),
        apiClient.get('/api/admin/submissions/by-facility'),
        apiClient.get('/api/admin/dashboard/insights'),
      ]);
      setSubmissions(submissionsRes.data);
      setGroupedSubmissions(groupedRes.data);
      setInsights(insightsRes.data);
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
            <TableCell>Facility ID</TableCell>
            <TableCell>Submitted By</TableCell>
            <TableCell>Submitted At</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Review Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission._id}>
              <TableCell>{submission.facilityId}</TableCell>
              <TableCell>
                {submission.userId?.name || submission.userId?.username || 'Unknown'}
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
                <Box sx={{ display: 'flex', gap: 1 }}>
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
  );

  const renderByFacility = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {Object.entries(groupedSubmissions).map(([facilityId, facilitySubmissions]) => (
        <Paper key={facilityId} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Facility: {facilityId} ({facilitySubmissions.length} submissions)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
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
                      {submission.userId?.name || submission.userId?.username || 'Unknown'}
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
                      <Box sx={{ display: 'flex', gap: 1 }}>
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
      ))}
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
            Admin Dashboard
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
              </Tabs>
            </Paper>

            {activeTab === 0 && renderAllSubmissions()}
            {activeTab === 1 && renderByFacility()}
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

