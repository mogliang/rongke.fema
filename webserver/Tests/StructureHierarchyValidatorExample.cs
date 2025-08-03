using System;
using System.Collections.Generic;
using Rongke.Fema.Domain;
using Rongke.Fema.Dto;

namespace Rongke.Fema.Tests
{
    /// <summary>
    /// Example usage and test scenarios for StructureHierarchyValidator
    /// </summary>
    public class StructureHierarchyValidatorExample
    {
        public static void RunExamples()
        {
            Console.WriteLine("=== StructureHierarchyValidator Examples ===");

            // Example 1: Valid hierarchy
            Console.WriteLine("\n1. Testing valid hierarchy:");
            TestValidHierarchy();

            // Example 2: Circular reference detection
            Console.WriteLine("\n2. Testing circular reference detection:");
            TestCircularReference();

            // Example 3: Self-referencing structure
            Console.WriteLine("\n3. Testing self-referencing structure:");
            TestSelfReference();

            // Example 4: Complex circular chain
            Console.WriteLine("\n4. Testing complex circular chain:");
            TestComplexCircularChain();
        }

        private static void TestValidHierarchy()
        {
            var validator = new StructureHierarchyValidator();
            
            var structures = new List<FMStructureDto2>
            {
                new FMStructureDto2
                {
                    Code = "ROOT",
                    LongName = "Root Structure",
                    ShortName = "ROOT",
                    Category = "System",
                    ParentFMStructureCode = null,
                    ChildFMStructures = new List<FMStructureDto2>
                    {
                        new FMStructureDto2
                        {
                            Code = "CHILD1",
                            LongName = "Child 1",
                            ShortName = "CH1",
                            Category = "Subsystem",
                            ParentFMStructureCode = "ROOT"
                        },
                        new FMStructureDto2
                        {
                            Code = "CHILD2",
                            LongName = "Child 2",
                            ShortName = "CH2",
                            Category = "Subsystem",
                            ParentFMStructureCode = "ROOT"
                        }
                    }
                }
            };

            // Flatten the structure
            var flatList = new List<FMStructureDto2>();
            bool flattenSuccess = validator.FlattenStructures(structures[0], flatList);
            
            // Validate hierarchy
            bool isValid = validator.ValidateHierarchy(flatList);
            
            Console.WriteLine($"Flatten success: {flattenSuccess}");
            Console.WriteLine($"Hierarchy valid: {isValid}");
            Console.WriteLine($"Structures count: {flatList.Count}");
        }

        private static void TestCircularReference()
        {
            var validator = new StructureHierarchyValidator();
            
            // Create structures with circular reference: A -> B -> A
            var structures = new List<FMStructureDto2>
            {
                new FMStructureDto2
                {
                    Code = "A",
                    LongName = "Structure A",
                    ShortName = "A",
                    Category = "System",
                    ParentFMStructureCode = "B" // Points to B
                },
                new FMStructureDto2
                {
                    Code = "B",
                    LongName = "Structure B",
                    ShortName = "B",
                    Category = "System",
                    ParentFMStructureCode = "A" // Points to A - creates cycle
                }
            };

            bool isValid = validator.ValidateHierarchy(structures);
            Console.WriteLine($"Circular reference detected (should be false): {isValid}");
        }

        private static void TestSelfReference()
        {
            var validator = new StructureHierarchyValidator();
            
            // Create structure that references itself
            var structures = new List<FMStructureDto2>
            {
                new FMStructureDto2
                {
                    Code = "SELF",
                    LongName = "Self Referencing Structure",
                    ShortName = "SELF",
                    Category = "System",
                    ParentFMStructureCode = "SELF" // Points to itself
                }
            };

            bool isValid = validator.ValidateHierarchy(structures);
            Console.WriteLine($"Self-reference detected (should be false): {isValid}");
        }

        private static void TestComplexCircularChain()
        {
            var validator = new StructureHierarchyValidator();
            
            // Create complex circular chain: A -> B -> C -> D -> B
            var structures = new List<FMStructureDto2>
            {
                new FMStructureDto2
                {
                    Code = "A",
                    LongName = "Structure A",
                    ShortName = "A",
                    Category = "System",
                    ParentFMStructureCode = null // Root
                },
                new FMStructureDto2
                {
                    Code = "B",
                    LongName = "Structure B",
                    ShortName = "B",
                    Category = "System",
                    ParentFMStructureCode = "A"
                },
                new FMStructureDto2
                {
                    Code = "C",
                    LongName = "Structure C",
                    ShortName = "C",
                    Category = "System",
                    ParentFMStructureCode = "B"
                },
                new FMStructureDto2
                {
                    Code = "D",
                    LongName = "Structure D",
                    ShortName = "D",
                    Category = "System",
                    ParentFMStructureCode = "C"
                }
            };

            // Now create the circular reference by making D point back to B
            structures[3].ParentFMStructureCode = "B"; // D -> B creates cycle B -> C -> D -> B

            bool isValid = validator.ValidateHierarchy(structures);
            Console.WriteLine($"Complex circular chain detected (should be false): {isValid}");
        }
    }
}
