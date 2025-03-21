const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
  
    return (
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => onPageChange(i + 1)}
            className={`px-3 py-1 rounded-lg ${
              currentPage === i + 1 
                ? 'bg-emerald-600 text-white' 
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    );
  };

export default Pagination;