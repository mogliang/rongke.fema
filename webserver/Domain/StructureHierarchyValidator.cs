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
