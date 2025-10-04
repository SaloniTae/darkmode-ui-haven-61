
import { 
  fetchData, updateData, setData, removeData, subscribeToData,
  fetchPrimeData, updatePrimeData, setPrimeData, removePrimeData, subscribeToPrimeData,
  fetchNetflixData, updateNetflixData, setNetflixData, removeNetflixData, subscribeToNetflixData,
  fetchNswfData, updateNswfData, setNswfData, removeNswfData, subscribeToNswfData
} from "@/lib/firebaseService";
import { ServiceType } from "@/types/auth";

export const useFirebaseService = (service: ServiceType | string) => {
  const getServiceFunctions = () => {
    switch (service) {
      case 'prime':
        return {
          fetchData: fetchPrimeData,
          updateData: updatePrimeData,
          setData: setPrimeData,
          removeData: removePrimeData,
          subscribeToData: subscribeToPrimeData
        };
      case 'netflix':
        return {
          fetchData: fetchNetflixData,
          updateData: updateNetflixData,
          setData: setNetflixData,
          removeData: removeNetflixData,
          subscribeToData: subscribeToNetflixData
        };
      case 'NSFW':
        return {
          fetchData: fetchNswfData,
          updateData: updateNswfData,
          setData: setNswfData,
          removeData: removeNswfData,
          subscribeToData: subscribeToNswfData
        };
      default:
        return {
          fetchData,
          updateData,
          setData,
          removeData,
          subscribeToData
        };
    }
  };

  // Helper function to extract credentials from database data
  const extractCredentials = (dbData: any) => {
    if (!dbData) return {};
    
    const credentials: { [key: string]: any } = {};
    
    // Only include credentials that actually exist and have meaningful data
    Object.keys(dbData).forEach(key => {
      if (key.startsWith('cred') && dbData[key] && typeof dbData[key] === 'object') {
        const cred = dbData[key];
        // Only include if it has at least email or password (not just empty strings)
        if (cred.email || cred.password) {
          credentials[key] = cred;
        }
      }
    });
    
    return credentials;
  };

  return {
    ...getServiceFunctions(),
    extractCredentials
  };
};
