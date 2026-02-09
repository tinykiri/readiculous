import { createContext, ReactNode, useContext, useState } from "react";

interface SearchContextType {
  searchText: string;
  setSearchText: (text: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchText, setSearchText] = useState("");

  return (
    <SearchContext.Provider value={{ searchText, setSearchText }}>
      {children}
    </SearchContext.Provider>
  )
};

export const useSearchContext = () => {
  const context = useContext(SearchContext);

  if (context === undefined) {
    throw new Error("useSearchContext must be used within a SearchProvider");
  }

  return context;
};