/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   color_parsing.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/14 12:13:28 by adahroug          #+#    #+#             */
/*   Updated: 2025/05/16 16:13:31 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "cub3d.h"

int check_color(char *color, t_data *p)
{
	char **colors;
	int i;
	int j;

	j = 0;
	colors = ft_split(color, ',');
	if (!recheck_colors(colors))
	{
		free_2d_array(colors);
		return 0;
	}
	while (colors[j] != NULL)
	{
		i = 0;
		while (colors[j][i] != '\0')
		{
			if (colors[j][i] < '0' || colors[j][i] > '9')
			{
				free_2d_array(colors);
				return 0;
			}
			i++;
		}
		j++;
	}
	handle_color(colors, p);
	free_2d_array(colors);
	return 1;
}
int recheck_colors(char **colors)
{
	int i;
	i = 0;
	
	while (colors[i] != NULL)
		i++;
	if (i != 3)
		return 0;
	return 1;
}
void handle_color(char **colors, t_data *p)
{
	int i;
	int nb;

	i = 0;
	while (colors[i] != NULL)
	{
		nb = ft_atoi(colors[i]);
		if (nb > 255 || nb < 0)
		{
			error_message("problem with the color\n");
			free_allocated(p);
			exit(EXIT_FAILURE);	
		}
		i++;
	}
}
