import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bot, BookOpen, ChevronDown, Search, Tag } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interface for FinancialQuestion from our database
interface FinancialQuestion {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relatedQuestions?: string[];
}

// Interface for financial concepts (glossary terms)
interface FinancialConcept {
  name: string;
  explanation: string;
  examples: string[];
  tips: string[];
  furtherReading: string[];
}

const FinancialAssistant: React.FC = () => {
  // State for the search query
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>("beginner");
  const [activeTab, setActiveTab] = useState("search");
  const [selectedQuestion, setSelectedQuestion] = useState<FinancialQuestion | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [glossaryTerm, setGlossaryTerm] = useState("");
  const [selectedConcept, setSelectedConcept] = useState<FinancialConcept | null>(null);

  // Search results 
  const { data: searchResults, isLoading: searchLoading, error: searchError, refetch: refetchSearch } = useQuery<{answers: FinancialQuestion[]}>({
    queryKey: ["/api/financial-assistant/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { answers: [] };
      const response = await fetch(`/api/financial-assistant/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search');
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Get question details when a question is selected
  const { data: questionDetails, isLoading: questionLoading, error: questionError } = useQuery<{question: FinancialQuestion, related: FinancialQuestion[]}>({
    queryKey: ["/api/financial-assistant/question", selectedQuestion?.id],
    queryFn: async () => {
      if (!selectedQuestion?.id) throw new Error('No question selected');
      const response = await fetch(`/api/financial-assistant/question/${selectedQuestion.id}`);
      if (!response.ok) throw new Error('Failed to get question details');
      return response.json();
    },
    enabled: !!selectedQuestion?.id,
  });

  // Get questions by difficulty level
  const { data: difficultyQuestions, isLoading: difficultyLoading, error: difficultyError } = useQuery<{questions: FinancialQuestion[]}>({
    queryKey: ["/api/financial-assistant/difficulty", selectedDifficulty],
    queryFn: async () => {
      const response = await fetch(`/api/financial-assistant/difficulty/${selectedDifficulty}`);
      if (!response.ok) throw new Error(`Failed to get ${selectedDifficulty} questions`);
      return response.json();
    },
    enabled: activeTab === 'difficulty',
  });

  // Get questions by tag
  const { data: tagQuestions, isLoading: tagLoading, error: tagError } = useQuery<{questions: FinancialQuestion[]}>({
    queryKey: ["/api/financial-assistant/tag", selectedTag],
    queryFn: async () => {
      if (!selectedTag) return { questions: [] };
      const response = await fetch(`/api/financial-assistant/tag/${encodeURIComponent(selectedTag)}`);
      if (!response.ok) throw new Error(`Failed to get questions for tag ${selectedTag}`);
      return response.json();
    },
    enabled: !!selectedTag && activeTab === 'tags',
  });
  
  // Get all financial concepts (glossary terms)
  const { data: glossaryData, isLoading: glossaryLoading, error: glossaryError } = useQuery<{concepts: FinancialConcept[]}>({
    queryKey: ["/api/financial-assistant/glossary"],
    queryFn: async () => {
      const response = await fetch(`/api/financial-assistant/glossary`);
      if (!response.ok) throw new Error("Failed to fetch financial concepts");
      return response.json();
    },
  });
  
  // Get details for a specific financial concept
  const { data: conceptDetails, isLoading: conceptLoading, error: conceptError } = useQuery<FinancialConcept>({
    queryKey: ["/api/financial-assistant/glossary", glossaryTerm],
    queryFn: async () => {
      if (!glossaryTerm.trim()) throw new Error("No concept selected");
      // Get user experience level based on current selection
      const response = await fetch(`/api/financial-assistant/glossary/${encodeURIComponent(glossaryTerm)}?level=${selectedDifficulty}`);
      if (!response.ok) throw new Error(`Failed to get details for ${glossaryTerm}`);
      return response.json();
    },
    enabled: !!glossaryTerm.trim(),
  });

  // Extract all unique tags from search results for the dropdown
  useEffect(() => {
    if (searchResults?.answers) {
      const tags = new Set<string>();
      searchResults.answers.forEach(answer => {
        answer.tags.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    }
  }, [searchResults]);

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      refetchSearch();
    }
  };

  // Handle selecting a question to view its details
  const handleSelectQuestion = (question: FinancialQuestion) => {
    setSelectedQuestion(question);
  };

  // Function to find relevant glossary term 
  const findGlossaryTerm = (term: string) => {
    if (!term.trim()) return;
    
    // Set the glossary term for the concept details query
    setGlossaryTerm(term);
    
    // Also clear any previously selected question
    setSelectedQuestion(null);
    
    // Set the active tab to "search" to show the concept details immediately
    setActiveTab("search");
  };
  
  // Set the financial concept when details are loaded
  useEffect(() => {
    if (conceptDetails) {
      setSelectedConcept(conceptDetails);
    }
  }, [conceptDetails]);
  
  // Use the concepts from the API response
  const conceptsList = glossaryData?.concepts || [];

  return (
    <section className="mb-8">
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-1">Financial Knowledge Center</h2>
              <p className="text-neutral-600 max-w-lg">
                Access comprehensive financial guidance tailored to your experience level
              </p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-white/50 grid grid-cols-3 h-auto p-1 gap-1">
              <TabsTrigger value="search" className="data-[state=active]:bg-white py-2">
                <Search className="h-4 w-4 mr-2" /> Search Knowledge
              </TabsTrigger>
              <TabsTrigger value="difficulty" className="data-[state=active]:bg-white py-2">
                <BookOpen className="h-4 w-4 mr-2" /> By Expertise
              </TabsTrigger>
              <TabsTrigger value="tags" className="data-[state=active]:bg-white py-2">
                <Tag className="h-4 w-4 mr-2" /> By Category
              </TabsTrigger>
            </TabsList>

            {/* SEARCH TAB */}
            <TabsContent value="search" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Search Financial Concepts</CardTitle>
                  <CardDescription>
                    Explore personal finance, investing, budgeting, and wealth-building strategies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          className="pr-24"
                          placeholder="Search financial concepts, terms, and strategies..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch();
                          }}
                        />
                        <div className="absolute right-2 top-2">
                          <Button
                            onClick={handleSearch}
                            size="sm"
                            disabled={searchLoading || !searchQuery.trim()}
                          >
                            {searchLoading ? "Searching..." : "Search"}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Financial Terms Glossary Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="gap-1">
                            Glossary <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
                          {glossaryLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm">Loading terms...</span>
                            </div>
                          ) : glossaryError ? (
                            <div className="p-3 text-sm text-red-500">Failed to load glossary terms</div>
                          ) : (
                            conceptsList.length > 0 ? (
                              conceptsList.map(concept => (
                                <DropdownMenuItem 
                                  key={concept.name} 
                                  onClick={() => findGlossaryTerm(concept.name)}
                                >
                                  {concept.name}
                                </DropdownMenuItem>
                              ))
                            ) : (
                              // Fallback to hardcoded terms if no terms from API
                              [
                                "401(k)", "529 Plan", "Amortization", "Annuity", "APR", "APY", 
                                "Asset Allocation", "Asset Class", "Balance Sheet", "Bear Market", 
                                "Compound Interest", "Credit Score", "Debt-to-Income Ratio", "Diversification", 
                                "Emergency Fund", "Equity", "ETF", "IRA", "Mutual Fund", "Net Worth"
                              ].map(term => (
                                <DropdownMenuItem 
                                  key={term} 
                                  onClick={() => findGlossaryTerm(term)}
                                >
                                  {term}
                                </DropdownMenuItem>
                              ))
                            )
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Loading state */}
                  {searchLoading && (
                    <div>
                      <p className="text-sm text-neutral-500 mb-3">Searching financial knowledge base...</p>
                      <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  )}

                  {/* Error state */}
                  {searchError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        Failed to search. Please try again later.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* No results */}
                  {!searchLoading && searchResults && searchResults.answers && searchResults.answers.length === 0 && searchQuery && (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">No results found for "{searchQuery}"</p>
                      <p className="text-sm mt-2">Try different keywords or browse by category</p>
                    </div>
                  )}

                  {/* Search results */}
                  {!searchLoading && searchResults && searchResults.answers && searchResults.answers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Results for "{searchQuery}"</h3>
                      <div className="space-y-4">
                        {searchResults.answers.map((result) => (
                          <div 
                            key={result.id} 
                            className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer"
                            onClick={() => handleSelectQuestion(result)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{result.question}</h4>
                              <Badge variant={
                                result.difficulty === 'beginner' ? 'outline' : 
                                result.difficulty === 'intermediate' ? 'secondary' : 
                                'destructive'
                              }>
                                {result.difficulty}
                              </Badge>
                            </div>
                            <p className="text-neutral-600 line-clamp-2">{result.answer.split('\n\n')[0].replace(/\*/g, '')}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {result.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{result.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected financial concept */}
              {selectedConcept && !selectedQuestion && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{selectedConcept.name}</CardTitle>
                      <Badge variant="outline">
                        {selectedDifficulty}
                      </Badge>
                    </div>
                    <CardDescription>
                      Financial Term Definition
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {conceptLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading term explanation...</span>
                      </div>
                    ) : conceptError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>Failed to load term explanation. Please try again.</AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Explanation</h3>
                          <p className="text-neutral-700">{selectedConcept.explanation}</p>
                        </div>
                        
                        {selectedConcept.examples.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-2">Examples</h3>
                            <ul className="list-disc pl-5 space-y-1">
                              {selectedConcept.examples.map((example, i) => (
                                <li key={i} className="text-neutral-700">{example}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedConcept.tips.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-2">Practical Tips</h3>
                            <ul className="list-disc pl-5 space-y-1">
                              {selectedConcept.tips.map((tip, i) => (
                                <li key={i} className="text-neutral-700">{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedConcept.furtherReading.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-2">Further Reading</h3>
                            <ul className="list-disc pl-5 space-y-1">
                              {selectedConcept.furtherReading.map((resource, i) => (
                                <li key={i} className="text-neutral-700">{resource}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Selected question details */}
              {selectedQuestion && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{selectedQuestion.question}</CardTitle>
                      <Badge variant={
                        selectedQuestion.difficulty === 'beginner' ? 'outline' : 
                        selectedQuestion.difficulty === 'intermediate' ? 'secondary' : 
                        'destructive'
                      }>
                        {selectedQuestion.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>
                      Topics: {selectedQuestion.tags.join(', ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {questionLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading concept details...</span>
                      </div>
                    ) : (
                      <>
                        <div className="prose prose-green max-w-none">
                          {selectedQuestion.answer.split('\n\n').map((paragraph, i) => {
                            // Remove any asterisks (*) from the text for cleaner presentation
                            const cleanedParagraph = paragraph.replace(/\*/g, '');
                            return <p key={i}>{cleanedParagraph}</p>;
                          })}
                        </div>
                        
                        {/* Related questions */}
                        {questionDetails?.related && questionDetails.related.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-medium mb-3">Related Questions</h4>
                            <div className="space-y-2">
                              {questionDetails.related.map((related) => (
                                <div 
                                  key={related.id}
                                  className="p-3 bg-neutral-50 rounded-md cursor-pointer hover:bg-neutral-100"
                                  onClick={() => handleSelectQuestion(related)}
                                >
                                  {related.question}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* DIFFICULTY LEVEL TAB */}
            <TabsContent value="difficulty" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Browse by Expertise Level</CardTitle>
                  <CardDescription>
                    Access financial concepts tailored to your knowledge and experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant={selectedDifficulty === "beginner" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setSelectedDifficulty("beginner")}
                      >
                        Beginner
                      </Button>
                      <Button 
                        variant={selectedDifficulty === "intermediate" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setSelectedDifficulty("intermediate")}
                      >
                        Intermediate
                      </Button>
                      <Button 
                        variant={selectedDifficulty === "advanced" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setSelectedDifficulty("advanced")}
                      >
                        Advanced
                      </Button>
                    </div>
                  </div>

                  {/* Loading state */}
                  {difficultyLoading && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading financial concepts...</span>
                    </div>
                  )}

                  {/* This section has been removed since we now default to beginner */}

                  {/* Questions by difficulty */}
                  {!difficultyLoading && difficultyQuestions && difficultyQuestions.questions && difficultyQuestions.questions.length > 0 && (
                    <div className="space-y-4">
                      {difficultyQuestions.questions.map((question) => (
                        <div 
                          key={question.id} 
                          className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer"
                          onClick={() => handleSelectQuestion(question)}
                        >
                          <h4 className="font-medium mb-1">{question.question}</h4>
                          <p className="text-neutral-600 line-clamp-2">{question.answer.split('\n\n')[0].replace(/\*/g, '')}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {question.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAGS TAB */}
            <TabsContent value="tags" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Browse by Financial Category</CardTitle>
                  <CardDescription>
                    Explore specialized financial topics organized by subject area
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Select 
                      value={selectedTag || ''} 
                      onValueChange={setSelectedTag}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Browse financial categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Commonly used financial topics */}
                        <SelectItem value="investing">Investing</SelectItem>
                        <SelectItem value="budgeting">Budgeting</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="retirement">Retirement</SelectItem>
                        <SelectItem value="debt">Debt</SelectItem>
                        <SelectItem value="taxes">Taxes</SelectItem>
                        <SelectItem value="saving">Saving</SelectItem>
                        <SelectItem value="financial planning">Financial Planning</SelectItem>
                        <SelectItem value="banking">Banking</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="estate planning">Estate Planning</SelectItem>
                        <SelectItem value="healthcare">Healthcare Finance</SelectItem>
                        <SelectItem value="mortgage">Mortgages & Housing</SelectItem>
                        <SelectItem value="stocks">Stocks</SelectItem>
                        <SelectItem value="bonds">Bonds</SelectItem>
                        <SelectItem value="funds">Funds & ETFs</SelectItem>
                        <SelectItem value="income">Income Management</SelectItem>
                        <SelectItem value="career">Career & Compensation</SelectItem>
                        <SelectItem value="cryptocurrency">Cryptocurrency</SelectItem>
                        <SelectItem value="real estate">Real Estate</SelectItem>
                        
                        {/* Other tags from search results */}
                        {allTags
                          .filter(tag => ![
                            'investing', 'budgeting', 'credit', 'retirement', 'debt', 'taxes', 
                            'saving', 'financial planning', 'banking', 'insurance', 'estate planning',
                            'healthcare', 'mortgage', 'stocks', 'bonds', 'funds', 'income', 
                            'career', 'cryptocurrency', 'real estate'
                          ].includes(tag))
                          .map(tag => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Loading state */}
                  {tagLoading && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading financial resources...</span>
                    </div>
                  )}

                  {/* No selection */}
                  {!tagLoading && !selectedTag && (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">Choose a financial category to explore relevant concepts</p>
                      <p className="text-sm mt-2 text-neutral-400">Browse investing, budgeting, retirement, and many more topics</p>
                    </div>
                  )}

                  {/* Questions by tag */}
                  {!tagLoading && tagQuestions && tagQuestions.questions && tagQuestions.questions.length > 0 && (
                    <div className="space-y-4">
                      {tagQuestions.questions.map((question) => (
                        <div 
                          key={question.id} 
                          className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer"
                          onClick={() => handleSelectQuestion(question)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{question.question}</h4>
                            <Badge variant={
                              question.difficulty === 'beginner' ? 'outline' : 
                              question.difficulty === 'intermediate' ? 'secondary' : 
                              'destructive'
                            }>
                              {question.difficulty}
                            </Badge>
                          </div>
                          <p className="text-neutral-600 line-clamp-2">{question.answer.split('\n\n')[0].replace(/\*/g, '')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default FinancialAssistant;