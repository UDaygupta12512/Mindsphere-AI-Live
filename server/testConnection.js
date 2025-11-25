import mongoose from 'mongoose';

const uri = 'mongodb+srv://abhay:abhay1234@cluster0.nmv8f0n.mongodb.net/mindsphere?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

 