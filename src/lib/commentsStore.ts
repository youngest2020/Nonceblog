
export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface PostInteractions {
  postId: string;
  likes: number;
  shares: number;
  comments: Comment[];
}

// Mock data for interactions
let interactions: PostInteractions[] = [
  {
    postId: "1",
    likes: 42,
    shares: 8,
    comments: [
      {
        id: "c1",
        postId: "1",
        author: "Jane Doe",
        content: "Great article! Really helpful insights.",
        createdAt: new Date().toISOString(),
        likes: 5
      },
      {
        id: "c2",
        postId: "1",
        author: "John Smith",
        content: "Thanks for sharing this. Looking forward to more content like this.",
        createdAt: new Date().toISOString(),
        likes: 3
      }
    ]
  }
];

export const commentsStore = {
  getPostInteractions: (postId: string) => 
    interactions.find(i => i.postId === postId) || { postId, likes: 0, shares: 0, comments: [] },
  
  addComment: (postId: string, author: string, content: string) => {
    const comment: Comment = {
      id: Date.now().toString(),
      postId,
      author,
      content,
      createdAt: new Date().toISOString(),
      likes: 0
    };
    
    let postInteractions = interactions.find(i => i.postId === postId);
    if (!postInteractions) {
      postInteractions = { postId, likes: 0, shares: 0, comments: [] };
      interactions.push(postInteractions);
    }
    
    postInteractions.comments.unshift(comment);
    return comment;
  },
  
  likePost: (postId: string) => {
    let postInteractions = interactions.find(i => i.postId === postId);
    if (!postInteractions) {
      postInteractions = { postId, likes: 0, shares: 0, comments: [] };
      interactions.push(postInteractions);
    }
    postInteractions.likes++;
    return postInteractions.likes;
  },
  
  sharePost: (postId: string) => {
    let postInteractions = interactions.find(i => i.postId === postId);
    if (!postInteractions) {
      postInteractions = { postId, likes: 0, shares: 0, comments: [] };
      interactions.push(postInteractions);
    }
    postInteractions.shares++;
    return postInteractions.shares;
  }
};
