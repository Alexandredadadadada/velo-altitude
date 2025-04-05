// Fonction Netlify pour l'endpoint /api/social/posts
// Cette fonction gère le module social pour partager les expériences cyclistes

const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Connexion à MongoDB Atlas
const mongoConnect = async () => {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });
  
  try {
    await client.connect();
    return client.db("dashboard-velo");
  } catch (error) {
    console.error("Erreur de connexion MongoDB:", error);
    throw error;
  }
};

// Vérifier l'authentification de l'utilisateur
const verifyToken = (token) => {
  try {
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return null;
  }
};

// Récupérer les posts sociaux avec pagination
const getSocialPosts = async (db, page = 1, limit = 10, filter = {}) => {
  try {
    const postsCollection = db.collection('social_posts');
    
    // Calculer le skip pour la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construire le filtre de recherche
    let query = { ...filter };
    
    // Récupérer les posts
    const posts = await postsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
      
    // Ajouter les informations utilisateur à chaque post
    const usersCollection = db.collection('users');
    const postsWithUserInfo = await Promise.all(posts.map(async (post) => {
      const user = await usersCollection.findOne({ _id: new ObjectId(post.userId) });
      return {
        ...post,
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          level: user.level
        }
      };
    }));
    
    // Compter le total pour la pagination
    const total = await postsCollection.countDocuments(query);
    
    return {
      posts: postsWithUserInfo,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des posts sociaux:", error);
    throw error;
  }
};

// Récupérer un post spécifique avec ses commentaires
const getSocialPostById = async (db, postId) => {
  try {
    const postsCollection = db.collection('social_posts');
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    
    if (!post) {
      return null;
    }
    
    // Récupérer les informations de l'utilisateur
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(post.userId) });
    
    // Récupérer les commentaires
    const commentsCollection = db.collection('social_comments');
    const comments = await commentsCollection
      .find({ postId: postId.toString() })
      .sort({ createdAt: 1 })
      .toArray();
    
    // Ajouter les informations utilisateur à chaque commentaire
    const commentsWithUserInfo = await Promise.all(comments.map(async (comment) => {
      const commentUser = await usersCollection.findOne({ _id: new ObjectId(comment.userId) });
      return {
        ...comment,
        user: {
          _id: commentUser._id,
          name: commentUser.name,
          avatar: commentUser.avatar,
          level: commentUser.level
        }
      };
    }));
    
    return {
      ...post,
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        level: user.level
      },
      comments: commentsWithUserInfo
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du post social:", error);
    throw error;
  }
};

// Créer un nouveau post
const createSocialPost = async (db, userId, postData) => {
  try {
    const postsCollection = db.collection('social_posts');
    
    const newPost = {
      ...postData,
      userId,
      likes: 0,
      comments: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await postsCollection.insertOne(newPost);
    return { ...newPost, _id: result.insertedId };
  } catch (error) {
    console.error("Erreur lors de la création du post social:", error);
    throw error;
  }
};

// Ajouter un commentaire à un post
const addComment = async (db, userId, postId, content) => {
  try {
    const commentsCollection = db.collection('social_comments');
    
    const newComment = {
      postId: postId.toString(),
      userId,
      content,
      createdAt: new Date()
    };
    
    const result = await commentsCollection.insertOne(newComment);
    
    // Incrémenter le compteur de commentaires du post
    const postsCollection = db.collection('social_posts');
    await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { comments: 1 } }
    );
    
    return { ...newComment, _id: result.insertedId };
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
    throw error;
  }
};

// Like/Unlike un post
const toggleLike = async (db, userId, postId) => {
  try {
    const likesCollection = db.collection('social_likes');
    
    // Vérifier si l'utilisateur a déjà liké le post
    const existingLike = await likesCollection.findOne({
      postId: postId.toString(),
      userId
    });
    
    const postsCollection = db.collection('social_posts');
    
    if (existingLike) {
      // Retirer le like
      await likesCollection.deleteOne({ _id: existingLike._id });
      
      // Décrémenter le compteur de likes du post
      await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { likes: -1 } }
      );
      
      return { liked: false };
    } else {
      // Ajouter le like
      await likesCollection.insertOne({
        postId: postId.toString(),
        userId,
        createdAt: new Date()
      });
      
      // Incrémenter le compteur de likes du post
      await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { likes: 1 } }
      );
      
      return { liked: true };
    }
  } catch (error) {
    console.error("Erreur lors du toggle like:", error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT",
    "Content-Type": "application/json"
  };

  // Gestion des requêtes OPTIONS (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS enabled" })
    };
  }
  
  try {
    // Extraire le token d'authentification
    const authHeader = event.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    
    // Vérifier l'authentification
    const decodedToken = verifyToken(token);
    const userId = decodedToken ? decodedToken.sub : null;
    
    // Connexion à la base de données
    const db = await mongoConnect();
    
    // Traiter la requête selon la méthode HTTP et le chemin
    const pathParts = event.path.split('/');
    const action = pathParts.pop();
    
    // GET /api/social/posts - Liste des posts
    if (event.httpMethod === "GET" && action === "posts") {
      const { page, limit, tag, region, col } = event.queryStringParameters || {};
      
      // Construire le filtre
      const filter = {};
      if (tag) filter.tags = tag;
      if (region) filter.region = region;
      if (col) filter.colId = col;
      
      const posts = await getSocialPosts(db, page, limit, filter);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(posts)
      };
    }
    
    // GET /api/social/posts/:id - Détails d'un post
    if (event.httpMethod === "GET" && action !== "posts") {
      const postId = action;
      const post = await getSocialPostById(db, postId);
      
      if (!post) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Post non trouvé" })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(post)
      };
    }
    
    // POST /api/social/posts - Créer un nouveau post
    if (event.httpMethod === "POST" && action === "posts") {
      // Vérifier l'authentification
      if (!userId) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: "Authentification requise" })
        };
      }
      
      const postData = JSON.parse(event.body);
      
      // Valider les données du post
      if (!postData.content || !postData.title) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Titre et contenu requis" })
        };
      }
      
      const post = await createSocialPost(db, userId, postData);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(post)
      };
    }
    
    // POST /api/social/posts/:id/comment - Ajouter un commentaire
    if (event.httpMethod === "POST" && pathParts.pop() === "comment") {
      // Vérifier l'authentification
      if (!userId) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: "Authentification requise" })
        };
      }
      
      const postId = action;
      const { content } = JSON.parse(event.body);
      
      if (!content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Contenu du commentaire requis" })
        };
      }
      
      const comment = await addComment(db, userId, postId, content);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(comment)
      };
    }
    
    // PUT /api/social/posts/:id/like - Like/Unlike un post
    if (event.httpMethod === "PUT" && pathParts.pop() === "like") {
      // Vérifier l'authentification
      if (!userId) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: "Authentification requise" })
        };
      }
      
      const postId = action;
      const result = await toggleLike(db, userId, postId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }
    
    // Route non trouvée
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Route non trouvée" })
    };
  } catch (error) {
    console.error("Erreur lors du traitement de la requête:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Erreur serveur",
        message: error.message
      })
    };
  }
};
