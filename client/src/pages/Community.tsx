import { useEffect, useState } from "react";
import { 
  useMutation, 
  useQuery, 
  useQueryClient 
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/auth/AuthModal";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HelpButton from "@/components/ui/help-button";

import {
  MessageSquare,
  ThumbsUp,
  Plus,
  X
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Skeleton,
} from "@/components/ui/skeleton";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Textarea,
} from "@/components/ui/textarea";

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string | null;
  authorLevel: number;
  date: string;
  tags: string[];
  likes: number;
  replies: number;
  authorId?: number; // Added to check if post belongs to current user
}

interface Category {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  postCount: number;
}

interface ReactionType {
  id: number;
  name: string;
  emoji: string;
  description?: string;
}

const Community = () => {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  const queryClient = useQueryClient();
  
  // Fetch posts
  const { data: postsData, isLoading: loadingPosts } = useQuery({
    queryKey: ["/api/community/posts"],
    queryFn: async () => {
      const response = await fetch("/api/community/posts");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    }
  });
  
  // Fetch categories
  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["/api/community/categories"],
    queryFn: async () => {
      const response = await fetch("/api/community/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    }
  });
  
  // Fetch reaction types
  const { data: reactionTypesData } = useQuery({
    queryKey: ["/api/community/reaction-types"],
    queryFn: async () => {
      const response = await fetch("/api/community/reaction-types");
      if (!response.ok) throw new Error("Failed to fetch reaction types");
      return response.json();
    }
  });
  
  // Selected category state
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Format the discussions data
  const discussions = postsData || [];
  
  // Format categories with post count
  const categories = categoriesData || [];
  
  // Format reaction types
  const reactionTypes = (() => {
    if (!reactionTypesData) return [
      { id: 1, name: "Like", emoji: "👍" },
      { id: 2, name: "Love", emoji: "❤️" },
      { id: 3, name: "Laugh", emoji: "😂" },
      { id: 4, name: "Wow", emoji: "😮" },
      { id: 5, name: "Sad", emoji: "😢" }
    ]; // Default emojis if API fails
    
    return reactionTypesData.map((type: any) => ({
      id: type.id,
      name: type.name,
      emoji: type.emoji,
      description: type.description
    }));
  })();
  
  // State for new post dialog
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");
  const [newPostForm, setNewPostForm] = useState({
    title: "",
    content: "",
    categoryId: 1,
    tags: [],
    type: "discussion",
  });
  
  // State for reply dialog
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyForm, setReplyForm] = useState({
    postId: 0,
    content: "",
    parentId: null as number | null,
  });
  
  // State for post detail dialog
  const [postDetailOpen, setPostDetailOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // State to track the currently viewed post for comments
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  
  // Fetch comments for selected post
  const { data: commentsData, isLoading: loadingComments } = useQuery({
    queryKey: ["/api/community/posts", selectedPostId, "comments"],
    enabled: !!selectedPostId,
    queryFn: async () => {
      if (!selectedPostId) return [];
      const response = await fetch(`/api/community/posts/${selectedPostId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    }
  });
  
  const { toast } = useToast();
  
  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({
        title: "Post created!",
        description: "Your discussion has been posted to the community.",
      });
      setNewPostOpen(false);
      setNewPostForm({
        title: "",
        content: "",
        categoryId: 1,
        tags: [],
        type: "discussion",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      const response = await fetch(`/api/community/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: commentData.postId,
          content: commentData.content,
          parentId: commentData.parentId || null
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post comment");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate the comments query to refresh the comments list
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", variables.postId, "comments"] });
      
      toast({
        title: "Comment posted",
        description: "Your comment has been added to the discussion.",
      });
      
      // Close the reply dialog and reset the form
      setReplyOpen(false);
      setReplyForm({
        postId: 0,
        content: "",
        parentId: null,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete post");
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({
        title: "Post deleted",
        description: "Your discussion has been removed from the community.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleViewPostDetails = (post: Post) => {
    // Set the selected post and post ID to fetch comments
    setSelectedPost(post);
    setSelectedPostId(post.id);
    setPostDetailOpen(true);
  };

  const handleOpenReplyDialog = (postId: number) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to reply to posts.",
        variant: "destructive",
      });
      return;
    }
    
    // Set the selected post ID to fetch comments
    setSelectedPostId(postId);
    
    setReplyForm({
      ...replyForm,
      postId: postId
    });
    setReplyOpen(true);
  };
  
  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to reply to posts.",
        variant: "destructive",
      });
      return;
    }
    
    if (!replyForm.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide content for your reply.",
        variant: "destructive",
      });
      return;
    }
    
    createCommentMutation.mutate(replyForm);
  };
  
  const handleReactToPost = (postId: number, reactionTypeId: number) => {
    if (!user) {
      setAuthModalMessage("Sign in or create a free account to like and react to posts.");
      setShowAuthModal(true);
      return;
    }
    
    fetch("/api/community/posts/react", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId,
        reactionTypeId,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to react to post");
        }
        return response.json();
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
        
        toast({
          title: "Reaction added",
          description: "Your reaction has been added to the post.",
        });
      })
      .catch(error => {
        toast({
          title: "Error reacting to post",
          description: error.message,
          variant: "destructive",
        });
      });
  };
  
  const handleDeletePost = (postId: number) => {
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deletePostMutation.mutate(postId);
    }
  };
  
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to create posts.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newPostForm.title.trim() || !newPostForm.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your post.",
        variant: "destructive",
      });
      return;
    }
    
    createPostMutation.mutate(newPostForm);
  };
 
  // UI Component
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold mb-2">Savyfunds Community™</h1>
            <p className="text-neutral-600">
              Connect with peers, share your financial journey, and learn from others
            </p>
          </header>
          
          <div className="grid md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingCategories ? (
                    // Loading skeleton for categories
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-6" />
                      </div>
                    ))
                  ) : (
                    <>
                      <div 
                        className={`flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-primary-100 ${
                          selectedCategory === null ? "bg-primary-50 font-medium" : ""
                        }`}
                        onClick={() => setSelectedCategory(null)}
                      >
                        <span>All Categories</span>
                        <span className="text-sm text-neutral-500">{discussions.length}</span>
                      </div>
                      
                      {categories.map((category: Category) => (
                        <div 
                          key={category.id}
                          className={`flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-primary-100 ${
                            selectedCategory === category.id ? "bg-primary-50 font-medium" : ""
                          }`}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <span>{category.name}</span>
                          <span className="text-sm text-neutral-500">{category.postCount || 0}</span>
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      if (!user) {
                        setAuthModalMessage("Sign in or create a free account to post in the community.");
                        setShowAuthModal(true);
                      } else {
                        setNewPostOpen(true);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Discussion
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3">
              <Card>
                <CardHeader className="border-b">
                  <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="popular">Popular</TabsTrigger>
                      <TabsTrigger value="recent">Recent</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingPosts ? (
                    // Loading skeleton for posts
                    <div className="space-y-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="border border-border">
                          <CardContent className="p-6">
                            <div className="flex gap-4">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="flex-1 space-y-4">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-5 w-1/3" />
                                <Skeleton className="h-24 w-full" />
                                <div className="flex gap-2">
                                  <Skeleton className="h-8 w-16" />
                                  <Skeleton className="h-8 w-16" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : discussions && discussions.length > 0 ? (
                    <div className="space-y-6">
                      {discussions.map((post: Post) => (
                        <Card 
                          key={post.id} 
                          className="hover:border-primary-200 transition-colors cursor-pointer"
                          onClick={() => handleViewPostDetails(post)}
                        >
                          <CardContent className="p-6">
                            <div className="flex gap-4">
                              <Avatar className="h-10 w-10">
                                {post.authorAvatar && (
                                  <AvatarImage src={post.authorAvatar} alt={post.author} />
                                )}
                                <AvatarFallback className="bg-primary-100 text-primary-700">
                                  {post.author.split(' ').map((n) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{post.title}</h3>
                                    <div className="flex items-center text-sm text-neutral-500 mt-1">
                                      <span>{post.author}</span>
                                      <span className="mx-2">•</span>
                                      <Badge variant="outline" className="font-normal bg-primary-50 text-primary-700">
                                        Level {post.authorLevel}
                                      </Badge>
                                      <span className="mx-2">•</span>
                                      <span>{post.date}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-start">
                                    {user && user.id === post.authorId && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 mr-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePost(post.id);
                                        }}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Delete
                                      </Button>
                                    )}
                                    <div className="flex gap-3 text-neutral-500">
                                      <div className="flex items-center">
                                        <ThumbsUp className="h-4 w-4 mr-1" />
                                        <span className="text-sm">{post.likes}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <MessageSquare className="h-4 w-4 mr-1" />
                                        <span className="text-sm">{post.replies}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <p className="mt-3 text-neutral-700">{post.content.length > 200 
                                  ? `${post.content.substring(0, 200)}...` 
                                  : post.content
                                }</p>
                                
                                {post.tags && post.tags.length > 0 && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {post.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="font-normal bg-primary-100 text-primary-700 hover:bg-primary-200">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="mt-4 flex gap-3 items-center">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-neutral-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReactToPost(post.id, 1);
                                    }}
                                  >
                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                    Like
                                  </Button>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-neutral-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenReplyDialog(post.id);
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Reply
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto opacity-30 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No discussions found</h3>
                      <p className="text-neutral-500 mb-6">Be the first to start a discussion in this community</p>
                      <Button onClick={() => {
                        if (!user) {
                          setAuthModalMessage("Sign in or create a free account to start a discussion.");
                          setShowAuthModal(true);
                        } else {
                          setNewPostOpen(true);
                        }
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Discussion
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Create Post Dialog */}
      <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Discussion</DialogTitle>
            <DialogDescription>
              Share your thoughts or questions with the community
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreatePost} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newPostForm.title}
                onChange={(e) => setNewPostForm({...newPostForm, title: e.target.value})}
                placeholder="E.g., How to budget on a variable income?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newPostForm.content}
                onChange={(e) => setNewPostForm({...newPostForm, content: e.target.value})}
                placeholder="Share your thoughts, experience, or questions..."
                className="min-h-[120px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="w-full p-2 border rounded-md"
                value={newPostForm.categoryId}
                onChange={(e) => setNewPostForm({...newPostForm, categoryId: Number(e.target.value)})}
              >
                {categories.map((category: Category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={newPostForm.tags.join(', ')}
                onChange={(e) => {
                  const tagsArray = e.target.value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
                  setNewPostForm({...newPostForm, tags: tagsArray});
                }}
                placeholder="e.g. budgeting, investing, debt"
              />
            </div>
            
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending && (
                  <span className="animate-spin mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                  </span>
                )}
                Create Post
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reply to Post</DialogTitle>
            <DialogDescription>
              Share your thoughts on this discussion
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitReply} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="replyContent">Your Reply</Label>
              <Textarea
                id="replyContent"
                value={replyForm.content}
                onChange={(e) => setReplyForm({...replyForm, content: e.target.value})}
                placeholder="Share your thoughts or advice..."
                className="min-h-[120px]"
              />
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={createCommentMutation.isPending}
              >
                {createCommentMutation.isPending && (
                  <span className="animate-spin mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                  </span>
                )}
                Post Reply
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Post Details Dialog */}
      <Dialog open={postDetailOpen} onOpenChange={setPostDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{selectedPost?.title || "Discussion"}</DialogTitle>
            <DialogDescription>
              View discussion details and comments
            </DialogDescription>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-6">
              {/* Post content */}
              <div className="flex gap-4">
                <Avatar className="h-10 w-10 mt-1">
                  <AvatarFallback className="bg-primary-100 text-primary-700">
                    {selectedPost.author.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedPost.author}</span>
                      <span className="text-sm text-muted-foreground">Level {selectedPost.authorLevel}</span>
                      <span className="text-xs text-muted-foreground">• {selectedPost.date}</span>
                    </div>
                    <div className="mt-4 text-gray-700 whitespace-pre-line">
                      {selectedPost.content}
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Reactions */}
                  <div className="flex gap-2 items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground"
                      onClick={() => handleReactToPost(selectedPost.id, 1)} // Like reaction
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {selectedPost.likes || 0}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground"
                      onClick={() => handleOpenReplyDialog(selectedPost.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t border-border"></div>
              
              {/* Comments section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Comments ({commentsData ? commentsData.length : 0})</h3>
                
                {loadingComments ? (
                  // Loading skeleton for comments
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : commentsData && commentsData.length > 0 ? (
                  <div className="space-y-6">
                    {commentsData.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-neutral-100 text-primary-700 text-xs">
                            {comment.author ? comment.author.substring(0, 2).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.author || 'Anonymous'}</span>
                            <span className="text-xs text-muted-foreground">Level {comment.authorLevel || 1}</span>
                            <span className="text-xs text-muted-foreground">
                              • {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Recently'}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto opacity-20 mb-2" />
                    <p>No comments yet. Be the first to join the discussion!</p>
                  </div>
                )}
                
                {/* Add comment button */}
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => handleOpenReplyDialog(selectedPost.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add a Comment
                </Button>
              </div>
            </div>
          )}
          
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogContent>
      </Dialog>

      <HelpButton />
      <Footer />

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        message={authModalMessage}
        defaultTab="signup"
      />
    </div>
  );
};

export default Community;