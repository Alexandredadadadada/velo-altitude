const fetch = require('node-fetch'); // Use node-fetch v2 for CommonJS require
const mongoose = require('mongoose');

// --- Mongoose Connection ---
let conn = null;
const mongoConnect = async () => {
    if (conn == null) {
        console.log('Creating new Mongoose connection...');
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI not set');
        // Ensure the database name is included, either in URI or as an option
        const dbName = process.env.MONGODB_DB_NAME || 'velo-altitude';
        conn = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            dbName: dbName // Specify DB name here if not in URI
        });
        console.log(`MongoDB connected via Mongoose to db: ${dbName}`);
    } else {
      console.log('Using existing Mongoose connection');
    }
    // Note: Mongoose handles the connection pool internally
    // We don't return conn.db here, mongoose methods work on the default connection
    // return conn; // Not needed for mongoose operations
};

// --- User Schema & Update Function ---
// Define schema only once
const UserSchema = new mongoose.Schema({
    auth0Id: { type: String, unique: true, required: true, index: true }, // Added index
    stravaTokens: {
        accessToken: String,
        refreshToken: String,
        expiresAt: Date
    },
    // Add other fields as needed
    name: String, 
    email: String
});
// Ensure model is registered only once to prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const updateUserStravaTokens = async (userId, stravaTokens) => {
    if (!userId || !stravaTokens || !stravaTokens.access_token || !stravaTokens.refresh_token || !stravaTokens.expires_at) {
        throw new Error("Missing userId or valid stravaTokens (access_token, refresh_token, expires_at required)");
    }
    
    try {
        // Ensure connection is established before operation
        await mongoConnect(); 

        const result = await User.findOneAndUpdate(
            { auth0Id: userId }, // Find by indexed field
            {
                $set: {
                    // Use dot notation for nested updates
                    'stravaTokens.accessToken': stravaTokens.access_token,
                    'stravaTokens.refreshToken': stravaTokens.refresh_token,
                    'stravaTokens.expiresAt': new Date(stravaTokens.expires_at * 1000) // Convert epoch seconds to Date
                }
            },
            { upsert: false, new: true } // Don't create user, just update existing; `new: true` is not strictly needed for findOneAndUpdate result check
        );
        if (!result) {
             console.warn(`Strava token update: User not found for auth0Id: ${userId}`);
             return false; // Indicate user not found
        }
        console.log(`Strava tokens successfully updated for user: ${userId}`);
        return true;
    } catch(error) {
         console.error(`Error updating Strava tokens for user ${userId}:`, error);
         throw error; // Re-throw error to be caught by handler
    }
};

// --- Main Handler ---
exports.handler = async (event, context) => {
    // --- 1. Check Authentication & Get User ID ---
    // Ensure context and user object exist, and sub is present
    if (!context.clientContext || !context.clientContext.user || !context.clientContext.user.sub) {
        console.error('User context or user.sub not found. Ensure Netlify Identity is configured and user is logged in.');
        // Redirect to an error page or login page
        return {
            statusCode: 302,
            headers: { 'Location': '/auth/error?message=User%20session%20not%20found' }, // Redirect to frontend error route
        };
    }
    const userId = context.clientContext.user.sub; // Auth0 User ID
    console.log(`Processing Strava callback for user: ${userId}`);

    // --- 2. Get Code from Query Parameters --- 
    const code = event.queryStringParameters.code;
    const error = event.queryStringParameters.error;

    // Handle errors returned from Strava (e.g., user denied access)
    if (error) {
        console.error('Error received from Strava redirect:', error);
        return {
            statusCode: 302,
            headers: { 'Location': '/auth/error?message=Strava%20authentication%20failed%20or%20denied' },
        };
    }

    // Ensure the authorization code is present
    if (!code) {
        console.error('No code parameter found in the request from Strava.');
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: 'Missing authorization code from Strava.' })
        };
    }
    
    // --- 3. Exchange Code for Tokens --- 
    const stravaTokenUrl = 'https://www.strava.com/oauth/token';
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    // Verify necessary environment variables are set
    if (!clientId || !clientSecret) {
        console.error("Strava client ID or secret is missing in environment variables.");
        return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
    }

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');

    try {
        // Make the POST request to Strava
        const response = await fetch(stravaTokenUrl, { 
            method: 'POST', 
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded' // Required header
            }
         });
        const stravaTokens = await response.json(); // Parse the JSON response

        // Check if the request to Strava was successful
        if (!response.ok) {
            console.error('Error exchanging Strava code for token:', stravaTokens);
            // Throw an error to be caught by the main try/catch block
            throw new Error(stravaTokens.message || 'Failed to exchange Strava code for token.');
        }
        console.log('Successfully exchanged code for Strava tokens.');

        // --- 4. Connect to DB & Update User --- 
        // Connection is handled within updateUserStravaTokens
        const updateSuccess = await updateUserStravaTokens(userId, stravaTokens);

        if (!updateSuccess) {
           // Log warning, but proceed with redirect for better UX unless critical
           console.warn("Failed to store Strava tokens in the database for user (user might not exist?):", userId);
           // Consider if a different redirect is needed here
        }

        // --- 5. Redirect on Success --- 
        // Redirect user back to a success page in the frontend application
        const frontendRedirectUrl = process.env.APP_BASE_URL || '/'; // Base URL of your React app
        const successUrl = `${frontendRedirectUrl}auth/callback/success?provider=strava`; // Define your success route
        
        console.log(`Redirecting user ${userId} to ${successUrl}`);
        return {
            statusCode: 302, // Perform redirect
            headers: { 'Location': successUrl }
        };

    } catch (error) {
        // Catch errors from fetch, JSON parsing, or DB update
        console.error('Error in Strava callback handler:', error);
        // Redirect to a generic error page on the frontend
        return { 
            statusCode: 302, 
            headers: {'Location': '/auth/error?message=Internal%20Server%20Error%20processing%20Strava%20auth'} 
        };
    }
};
