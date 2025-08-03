using System;
using System.Collections.Generic;
using System.Linq;
using Rongke.Fema.Dto;

namespace Rongke.Fema.Domain
{
    /// <summary>
    /// Helper class to validate structure hierarchies and prevent circular references
    /// </summary>
    public class StructureHierarchyValidator
    {
        private readonly HashSet<string> _visitedCodes = new HashSet<string>();
        private readonly HashSet<string> _currentPath = new HashSet<string>();

        /// <summary>
        /// Validates that the structure hierarchy has no circular references
        /// </summary>
        /// <param name="structures">List of all structures to validate</param>
        /// <returns>True if valid, false if circular reference detected</returns>
        public bool ValidateHierarchy(List<FMStructureDto2> structures)
        {
            _visitedCodes.Clear();
            _currentPath.Clear();

            // Check each structure that could be a root (no parent)
            var potentialRoots = structures.Where(s => 
                string.IsNullOrEmpty(s.ParentFMStructureCode)).ToList();

            foreach (var root in potentialRoots)
            {
                if (!_visitedCodes.Contains(root.Code))
                {
                    if (!ValidateStructureRecursive(root, structures))
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        /// <summary>
        /// Validates that a specific structure and its children have no circular references
        /// </summary>
        /// <param name="structure">The structure to validate</param>
        /// <param name="allStructures">All structures in the hierarchy</param>
        /// <returns>True if valid, false if circular reference detected</returns>
        public bool ValidateStructureRecursive(FMStructureDto2 structure, List<FMStructureDto2> allStructures)
        {
            // Check if we've already visited this structure in the current path (circular reference)
            if (_currentPath.Contains(structure.Code))
            {
                Console.WriteLine($"Circular reference detected: Structure {structure.Code} references itself in the hierarchy path");
                return false;
            }

            // Check if we've already fully validated this structure
            if (_visitedCodes.Contains(structure.Code))
            {
                return true;
            }

            // Add to current path
            _currentPath.Add(structure.Code);

            try
            {
                // Validate all children
                foreach (var child in structure.ChildFMStructures ?? new List<FMStructureDto2>())
                {
                    // Ensure child's parent reference is correct
                    if (child.ParentFMStructureCode != structure.Code)
                    {
                        child.ParentFMStructureCode = structure.Code;
                    }

                    if (!ValidateStructureRecursive(child, allStructures))
                    {
                        return false;
                    }
                }

                // Also check if this structure has a parent that would create a cycle
                if (!string.IsNullOrEmpty(structure.ParentFMStructureCode))
                {
                    var parent = allStructures.FirstOrDefault(s => s.Code == structure.ParentFMStructureCode);
                    if (parent != null && !_visitedCodes.Contains(parent.Code))
                    {
                        // Check if parent would create a cycle by looking up the chain
                        if (HasCircularParentReference(structure.ParentFMStructureCode, structure.Code, allStructures))
                        {
                            Console.WriteLine($"Circular parent reference detected: Structure {structure.Code} has a parent chain that leads back to itself");
                            return false;
                        }
                    }
                }

                // Mark as fully validated
                _visitedCodes.Add(structure.Code);
                return true;
            }
            finally
            {
                // Remove from current path when done
                _currentPath.Remove(structure.Code);
            }
        }

        /// <summary>
        /// Checks if following the parent chain from startCode would lead to targetCode
        /// </summary>
        private bool HasCircularParentReference(string startCode, string targetCode, List<FMStructureDto2> allStructures)
        {
            var visited = new HashSet<string>();
            var current = startCode;

            while (!string.IsNullOrEmpty(current) && !visited.Contains(current))
            {
                if (current == targetCode)
                {
                    return true; // Found circular reference
                }

                visited.Add(current);
                var currentStructure = allStructures.FirstOrDefault(s => s.Code == current);
                current = currentStructure?.ParentFMStructureCode;
            }

            return false;
        }

        /// <summary>
        /// Calculates the hierarchical level of a structure
        /// </summary>
        /// <param name="structureCode">The code of the structure</param>
        /// <param name="allStructures">All structures in the hierarchy</param>
        /// <returns>The hierarchical level (1 for root, 2 for children of root, etc.)</returns>
        public int CalculateLevel(string? structureCode, List<FMStructureDto2> allStructures)
        {
            if (string.IsNullOrEmpty(structureCode))
            {
                return 1; // Root level
            }

            var structure = allStructures.FirstOrDefault(s => s.Code == structureCode);
            if (structure == null)
            {
                return 1; // If structure not found, assume root level
            }

            return CalculateLevelRecursive(structure.ParentFMStructureCode, allStructures, new HashSet<string>());
        }

        /// <summary>
        /// Recursively calculates level with cycle detection
        /// </summary>
        private int CalculateLevelRecursive(string? parentCode, List<FMStructureDto2> allStructures, HashSet<string> visited)
        {
            if (string.IsNullOrEmpty(parentCode))
            {
                return 1; // Root level
            }

            if (visited.Contains(parentCode))
            {
                Console.WriteLine($"Circular reference detected while calculating level for {parentCode}");
                return 1; // Break cycle, assume root level
            }

            var parent = allStructures.FirstOrDefault(s => s.Code == parentCode);
            if (parent == null)
            {
                return 1; // If parent not found, assume root level
            }

            visited.Add(parentCode);
            return CalculateLevelRecursive(parent.ParentFMStructureCode, allStructures, visited) + 1;
        }

        /// <summary>
        /// Flattens a hierarchical structure into a list while ensuring no circular references
        /// </summary>
        /// <param name="structure">Root structure to flatten</param>
        /// <param name="flatList">Output list to populate</param>
        /// <returns>True if successful, false if circular reference detected</returns>
        public bool FlattenStructures(FMStructureDto2 structure, List<FMStructureDto2> flatList)
        {
            var visited = new HashSet<string>();
            return FlattenStructuresRecursive(structure, flatList, visited);
        }

        /// <summary>
        /// Recursively flattens structures with cycle detection
        /// </summary>
        private bool FlattenStructuresRecursive(FMStructureDto2 structure, List<FMStructureDto2> flatList, HashSet<string> visited)
        {
            if (visited.Contains(structure.Code))
            {
                Console.WriteLine($"Circular reference detected while flattening structure {structure.Code}");
                return false;
            }

            visited.Add(structure.Code);
            flatList.Add(structure);

            if (structure.ChildFMStructures != null)
            {
                foreach (var child in structure.ChildFMStructures)
                {
                    child.ParentFMStructureCode = structure.Code; // Ensure parent reference is set
                    if (!FlattenStructuresRecursive(child, flatList, visited))
                    {
                        return false;
                    }
                }
            }

            visited.Remove(structure.Code); // Remove after processing to allow multiple paths to same node
            return true;
        }
    }
}
