import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = 'http://localhost:8080';

export const login = createAsyncThunk('user/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_BASE}/login`, credentials);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Login failed');
  }
});

export const signup = createAsyncThunk('user/signup', async (userData, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_BASE}/signup`, userData);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Signup failed');
  }
});

export const updateProfile = createAsyncThunk('user/updateProfile', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await axios.put(`${API_BASE}/users/${id}`, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Update failed');
  }
});

const savedUser = localStorage.getItem('user');

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.error = null;
      localStorage.removeItem('user');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      });
  },
});

export const { logout, clearError } = userSlice.actions;
export default userSlice.reducer;