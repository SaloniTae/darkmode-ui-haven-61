
import { 
  fetchData, updateData, setData, removeData, subscribeToData,
  fetchPrimeData, updatePrimeData, setPrimeData, removePrimeData, subscribeToPrimeData,
  fetchNetflixData, updateNetflixData, setNetflixData, removeNetflixData, subscribeToNetflixData
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

  return getServiceFunctions();
};
