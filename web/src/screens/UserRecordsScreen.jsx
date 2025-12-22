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
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Home, Visibility, Refresh } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../utils/axiosConfig';

const UserRecordsScreen = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/ic-submission/submissions');
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Error loading your submissions');
      }
    } finally {
      setLoading(false);
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
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getReviewStatusColor = (reviewStatus) => {
    switch (reviewStatus) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/home')}
            sx={{ mr: 2 }}
          >
            <Home />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            My I&C Records
          </Typography>
          <IconButton color="inherit" onClick={fetchSubmissions}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3, pb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Submissions
                    </Typography>
                    <Typography variant="h4">
                      {submissions.filter((s) => s.status !== 'draft').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Approved
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {
                        submissions.filter(
                          (s) => s.approvalStatus?.reviewStatus === 'approved'
                        ).length
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Review
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {
                        submissions.filter(
                          (s) =>
                            s.status === 'submitted' &&
                            (!s.approvalStatus?.reviewStatus ||
                              s.approvalStatus.reviewStatus === 'pending')
                        ).length
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Paper>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Submission History
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Facility ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Review Status</TableCell>
                      <TableCell>Submitted At</TableCell>
                      <TableCell>Review Reason</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                            No submissions found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      submissions
                        .filter((s) => s.status !== 'draft')
                        .map((submission) => (
                          <TableRow key={submission._id}>
                            <TableCell>{submission.facilityId}</TableCell>
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
                                  color={getReviewStatusColor(
                                    submission.approvalStatus.reviewStatus
                                  )}
                                  size="small"
                                />
                              ) : (
                                <Chip label="pending" color="warning" size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              {submission.submittedAt
                                ? new Date(submission.submittedAt).toLocaleString()
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {submission.approvalStatus?.reviewReason || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() =>
                                  navigate(`/ic-preview?id=${submission._id}`)
                                }
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
};

export default UserRecordsScreen;

